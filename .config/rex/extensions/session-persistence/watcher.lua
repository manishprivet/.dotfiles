-- Run with rex do PATH --all. A live watcher survives config reloads.
local source = debug.getinfo(1, "S").source:gsub("^@", ""):match("^(.*)/")
local model = dofile(assert(source) .. "/agents.lua")
local function checked(value, err)
    if value == nil then error(err or "Rex call failed", 0) end
    return value
end
local function command(argv)
    local result = checked(rex.exec(argv))
    assert(result.ok, result.stderr or "Command failed")
    return result.stdout
end
local server = checked(rex.call("server.status", {}))
local home = assert(os.getenv("HOME"))
local base = (os.getenv("XDG_STATE_HOME") or (home .. "/.local/state")) .. "/rex"
-- Host identity is stable across restarts; scope distinguishes servers on a host.
local scope = os.getenv("REX_SESSION_PERSISTENCE_SCOPE") or "local"
assert(scope:match("^[%w_-]+$") and server.host_id:match("^[%w_-]+$"), "Invalid state identity")
local root = base .. "/session-persistence/" .. server.host_id .. "-" .. scope
command({ "/bin/mkdir", "-p", root })
command({ "/bin/chmod", "700", root })
local pid = command({ "/bin/sh", "-c", "echo \"$PPID\"" }):match("^%s*(%d+)%s*$")
assert(pid, "Cannot determine watcher PID")
-- No process signalling/takeover. shlock reclaims dead owners after crashes.
local claimed = checked(rex.exec({ "/usr/bin/shlock", "-p", pid, "-f", root .. "/watcher.lock" }))
if not claimed.ok then
    rex.log("info", "session-persistence: watcher already running (or lock unavailable)")
    return
end
-- Legacy layout snapshots and recovery files are intentionally never touched.
local path = root .. "/agents.json"
local function read(pathname, optional)
    local file, err = io.open(pathname, "r")
    if not file then
        local missing = checked(rex.exec({ "/bin/sh", "-c",
            '! { test -e "$1" || test -L "$1"; }', "session-persistence", pathname }))
        if optional and missing.ok then return nil end
        error(err, 0)
    end
    local text = file:read("*a")
    checked(file:close())
    return checked(rex.json.decode(text))
end
local function write(value, destination)
    destination = destination or path
    local file = checked(io.open(destination .. ".tmp", "w"))
    command({ "/bin/chmod", "600", destination .. ".tmp" })
    checked(file:write(checked(rex.json.encode(value)) .. "\n"))
    checked(file:close())
    checked(os.rename(destination .. ".tmp", destination))
end
local state = read(path, true) or { version = 1, agents = {} }
assert(state.version == 1 and type(state.agents) == "table", "Invalid agent state")

-- Poll only prior-instance candidates, bounded to the initial two minutes.
-- Native Rex owns all layouts; send a private Fish binding, never a command.
local readiness = dofile(source .. "/readiness.lua")
local resume_ready = readiness.new(state.agents, server.instance_id, os.time(), {
    read = function(id, kind) return read(root .. "/readiness/" .. id .. "." .. kind .. ".json", true) end,
    request = function(id, ready) write(ready, root .. "/readiness/" .. id .. ".request.json") end,
    idle = function(id, agent, ready)
        checked(rex.session.attach{ session_id = agent.rex_session })
        local process = checked(rex.block.call("com.superlogical.terminal", "process", {
            session_id = agent.rex_session, block_id = id,
        }))
        local identity = checked(rex.exec({ "/bin/ps", "-p", tostring(ready.shell_pid), "-o", "lstart=" }))
        return process.last_exit == nil and (process.foreground or {}).pid == ready.shell_pid
            and (process.foreground or {}).name == "fish" and identity.ok
            and identity.stdout == ready.shell_identity
    end,
    wake = function(id, agent)
        checked(rex.block.call("com.superlogical.terminal", "write", {
            session_id = agent.rex_session, block_id = id, data = "\27[24;8~",
        }))
    end,
    warn = function(err) rex.log("warn", "session-persistence: readiness check skipped: " .. tostring(err)) end,
})
rex.every(0.5, function() resume_ready(os.time()) end)

local dirty = true
local function mark() dirty = true end
for _, event in ipairs({ "session_created", "session_destroyed", "session_view_changed",
    "terminal.pwd_changed", "terminal.process_changed" }) do
    rex.on(event, mark)
end
local function save()
    for id in pairs(state.agents) do
        assert(id:match("^[%w:-]+$"), "Invalid saved block ID")
        local claim = read(root .. "/claims/" .. id .. ".json", true)
        if claim and claim.instance_id == server.instance_id then state.agents[id] = nil end
    end
    local function record_for(block_id)
        assert(block_id:match("^[%w:-]+$"), "Invalid block ID")
        return read(base .. "/agent-sessions/" .. block_id .. ".json", true)
    end
    local agents = model.collect(rex, server, state.agents, record_for, function(pid)
        if type(pid) ~= "number" or pid < 2 then return nil end
        local result = checked(rex.exec({ "/bin/ps", "-p", tostring(pid), "-o", "lstart=" }))
        return result.ok and result.stdout or nil
    end, function(id, record, process)
        local claim = read(root .. "/claims/" .. id .. ".json", true)
        if not claim or claim.instance_id ~= server.instance_id
            or type(claim.helper_pid) ~= "number" or type(claim.shell_pid) ~= "number"
            or (process.foreground or {}).pid ~= claim.shell_pid then return false end
        local identity = checked(rex.exec({ "/bin/ps", "-p", tostring(claim.helper_pid), "-o", "lstart=" }))
        if not identity.ok or identity.stdout ~= claim.helper_identity then return false end
        local result = checked(rex.exec({ "/bin/ps", "-p",
            table.concat({ record.pid, claim.helper_pid, claim.shell_pid }, ","),
            "-o", "pid=,ppid=,pgid=,tpgid=" }))
        if not result.ok then return false end
        local rows = {}
        for pid, parent, group, foreground in result.stdout:gmatch("(%d+)%s+(%d+)%s+(%d+)%s+(%d+)") do
            rows[tonumber(pid)] = { parent = tonumber(parent), group = group, foreground = foreground }
        end
        local agent, helper, shell = rows[record.pid], rows[claim.helper_pid], rows[claim.shell_pid]
        return agent and helper and shell and agent.parent == claim.helper_pid
            and helper.parent == claim.shell_pid and agent.group == shell.group
            and helper.group == shell.group and shell.group == shell.foreground
    end)
    local next_state = { version = 1, host_id = server.host_id, agents = agents }
    write(next_state)
    state = next_state
    dirty = false
end
local function safely_save()
    local ok, err = pcall(save)
    if not ok then rex.log("error", "session-persistence: agent state preserved: " .. tostring(err)) end
end
-- Coalesce event bursts, and periodically refresh cwd when shell integration
-- doesn't emit directory events. Never save from a shutdown/disconnect handler.
rex.every(1, function() if dirty then safely_save() end end)
-- Conversation switches need not change the foreground process.
rex.every(2, function() dirty = true end)
safely_save()
rex.log("info", "session-persistence: agent-only tracking; Rex owns layouts; state: " .. path)
