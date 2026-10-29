-- Run with rex do PATH --all. A live watcher survives config reloads.
local source = debug.getinfo(1, "S").source:gsub("^@", ""):match("^(.*)/")
local model = dofile(assert(source) .. "/state.lua")
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
local path = root .. "/snapshot.json"
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
local state = read(path, true)
if state then
    model.validate(state.snapshot)
end
local live = checked(rex.call("session.list", {})).sessions or {}
if state and state.instance_id ~= server.instance_id and not state.restoring then
    -- Keep the pre-restart layout even if a client wins the startup race or
    -- post-restore shell startup produces transient changes. Never overwrite
    -- this backup on a same-instance config reload.
    write(state, root .. "/before-restart.json")
end
if state and state.restoring and #live > 0 then
    error("session-persistence: interrupted restore; snapshot preserved. See extension README before retrying.", 0)
end
if state and state.instance_id ~= server.instance_id and #live == 0 and #state.snapshot.sessions > 0 then
    -- Persist intent before creating anything. On failure, never replace the
    -- good snapshot with a half-restored layout, even after a watcher restart.
    state.restoring = true
    write(state)
    rex.log("info", "session-persistence: restoring " .. #state.snapshot.sessions .. " session(s)")
    local restored, restore_error = pcall(model.restore, rex, state.snapshot)
    if not restored then
        error("session-persistence: restore failed; snapshot retained with restoring=true. "
            .. "Do not blindly retry a timed-out create; inspect live sessions first. "
            .. "For manual cold-start restore use rex --timeout 120s do PATH --all. Cause: "
            .. tostring(restore_error), 0)
    end
    state.restoring = nil
    write(state)
    rex.log("info", "session-persistence: restored shells and layouts")
elseif state and state.instance_id ~= server.instance_id and #live > 0 then
    rex.log("warn", "session-persistence: restore skipped because sessions already exist; "
        .. "pre-restart snapshot retained at " .. root .. "/before-restart.json")
end

local dirty = true
local function mark() dirty = true end
for _, event in ipairs({ "session_created", "session_destroyed", "session_view_changed",
    "terminal.pwd_changed", "terminal.process_changed" }) do
    rex.on(event, mark)
end
local function save()
    -- Only consult title ownership for the current server instance. Never guess
    -- whether a numeric prefix was user-written.
    local titles = read(base .. "/tab-numbers/" .. server.instance_id .. ".json", true)
    local function agent_for(session_id, block_id, process)
        assert(block_id:match("^[%w:-]+$"), "Invalid block ID")
        local record = read(base .. "/agent-sessions/" .. block_id .. ".json", true)
        if not record or record.rex_session ~= session_id then return nil end
        -- An inherited REX_BLOCK alone is not proof: nested/background agents
        -- must actually belong to the pane's foreground process chain.
        local found = false
        local chain = { process.foreground or {}, process.child or {} }
        for _, ancestor in ipairs(process.ancestors or {}) do chain[#chain + 1] = ancestor end
        for _, item in ipairs(chain) do if item.pid == record.pid then found = true end end
        if not found then return nil end
        local identity = checked(rex.exec({ "/bin/ps", "-p", tostring(record.pid), "-o", "lstart=" }))
        if not identity.ok or identity.stdout ~= record.identity then return nil end
        assert(type(record.cwd) == "string" and record.cwd:sub(1, 1) == "/", "Invalid agent cwd")
        return { agent = record.agent, session_id = record.session_id, cwd = record.cwd }
    end
    local snapshot = model.snapshot(rex, server, titles and titles.sessions, agent_for)
    model.validate(snapshot)
    write({ instance_id = server.instance_id, snapshot = snapshot })
    dirty = false
end
local function safely_save()
    local ok, err = pcall(save)
    if not ok then rex.log("error", "session-persistence: snapshot preserved: " .. tostring(err)) end
end
-- Coalesce event bursts, and periodically refresh cwd when shell integration
-- doesn't emit directory events. Never save from a shutdown/disconnect handler.
rex.every(1, function() if dirty then safely_save() end end)
rex.every(30, function() dirty = true end)
safely_save()
rex.log("info", "session-persistence: watching; snapshot: " .. path)
