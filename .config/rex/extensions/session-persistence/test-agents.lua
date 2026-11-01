local model = dofile(".config/rex/extensions/session-persistence/agents.lua")
local process = { foreground = { pid = 42 } }
local block = { block_id = "b", creator_name = "com.superlogical.terminal", host_id = "host" }
local api = {
    call = function(method) assert(method == "session.list"); return { sessions = { { session_id = "s" } } } end,
    session = {
        attach = function() return {} end,
        view = function() return { windows = { { layers = { { blocks = { block } } } } } } end,
    },
    block = { call = function() return process end },
}
local record = { agent = "opencode", session_id = "ses_exact", cwd = "/work", rex_session = "s", pid = 42, identity = "start" }
local server = { host_id = "host", instance_id = "one" }
local function collect(previous)
    return model.collect(api, server, previous, function() return record end, function() return "start" end)
end
local saved = collect()
assert(saved.b.session_id == "ses_exact" and saved.b.instance_id == "one")
assert(collect(saved).b.session_id == "ses_exact") -- already running; no launch API
process.foreground.pid = 99
assert(collect(saved).b == nil) -- exited in same server
local resumed = model.collect(api, server, {}, function() return record end,
    function() return "start" end, function(id, r, p)
        return id == "b" and r.pid == 42 and p.foreground.pid == 99
    end)
assert(resumed.b.session_id == "ses_exact") -- verified startup helper fallback
local stale = model.collect(api, server, {}, function() return record end,
    function() return "different-start" end, function() return true end)
assert(stale.b == nil) -- fallback still requires exact agent PID identity
server.instance_id = "two"
assert(collect(saved).b.session_id == "ses_exact") -- native-restored ID
block.block_id = "different"
assert(collect(saved).different == nil) -- labels/positions never used
block.block_id = "b"
block.host_id = "remote"
assert(next(collect(saved)) == nil)
block.host_id = "host"
record.rex_session = "other"
assert(collect().b == nil)
api.session.view = function() return nil, "disconnected" end
assert(not pcall(collect, saved))
print("native agent tracking: all tests passed")
