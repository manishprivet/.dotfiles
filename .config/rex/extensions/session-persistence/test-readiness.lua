local source = debug.getinfo(1, "S").source:gsub("^@", ""):match("^(.*)/")
local model = dofile(source .. "/readiness.lua")
local function fixture()
    local state = { ready = { instance_id = "new", rex_session = "s", shell_pid = 100,
        shell_identity = "start", expires = 220 }, reads = 0, writes = 0, wakes = 0, idle = true }
    state.tick = model.new({ b = { instance_id = "old", rex_session = "s" },
        current = { instance_id = "new", rex_session = "s" } }, "new", 100, {
        read = function(id, kind)
            assert(id == "b")
            state.reads = state.reads + 1
            return state[kind]
        end,
        idle = function() return state.idle end,
        request = function(_, ready) state.request = ready; state.writes = state.writes + 1 end,
        wake = function()
            assert(state.request)
            state.wakes = state.wakes + 1
            if state.fail then error("uncertain terminal write") end
        end,
        warn = function() state.warned = true end,
    })
    return state
end
for _, mutation in ipairs({
    function(s) s.ready.expires = 99 end,
    function(s) s.ready.instance_id = "old" end,
    function(s) s.ready.rex_session = "other" end,
    function(s) s.ready.shell_identity = nil end,
    function(s) s.ready.shell_pid = 0 end,
    function(s) s.idle = false end, -- Busy or stale process identity.
    function(s) s.ready = nil end,
}) do
    local s = fixture(); mutation(s); s.tick(100)
    assert(s.writes == 0 and s.wakes == 0)
end
local s = fixture(); s.tick(100); s.tick(101)
assert(s.writes == 1 and s.wakes == 1)
s = fixture(); s.fail = true; s.tick(100); s.tick(101)
assert(s.writes == 1 and s.wakes == 1 and s.warned)
s = fixture(); s.request = { instance_id = "new" }; s.tick(100)
assert(s.writes == 0 and s.wakes == 0)
s = fixture(); s.tick(221); s.tick(222)
assert(s.reads == 0 and s.wakes == 0)
print("startup readiness watcher: all tests passed")
