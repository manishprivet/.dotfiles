-- Run from the repository root: luajit .config/rex/extensions/tab-navigation/test.lua
-- Mock Rex: never changes the live client's selected tab or sidebar mode.
local action, bindings, queued = nil, {}, {}
local view = { windows = {
    { window_id = "tab-a", layers = { { blocks = { {}, {}, {} } } } },
    { window_id = "tab-b" },
} }
local view_error
rex = {
    action = function(value) action = value end,
    bind = function(key, name, args)
        bindings[key] = { name = name, args = args }
    end,
    session = { view = function(args)
        assert(args.session_id == "session-test")
        return view, view_error
    end },
    client = { queue = function(name, args)
        queued[#queued + 1] = { name = name, args = args }
    end },
}
dofile(".config/rex/extensions/tab-navigation/init.lua")
local function press(index)
    local binding = assert(bindings["ctrl+s>" .. index])
    assert(binding.name == action.name)
    action.run({ session_id = "session-test" }, binding.args)
end
for index = 1, 9 do assert(bindings["ctrl+s>" .. index]) end
press(2) -- Multiple activities/panes in tab 1 must not affect indexing.
assert(#queued == 1)
assert(queued[1].name == "session.select")
assert(queued[1].args.session_id == "session-test")
assert(queued[1].args.window_id == "tab-b")
view.windows = { view.windows[2], view.windows[1] }
press(2) -- Resolve the current order each time, not cached labels or IDs.
assert(queued[2].args.window_id == "tab-a")
press(9)
assert(#queued == 2)
view = {}
press(1)
assert(#queued == 2)
view, view_error = nil, "session unavailable"
local ok, err = pcall(press, 1)
assert(not ok and tostring(err):find(view_error, 1, true))
assert(#queued == 2)
print("tab-navigation: all tests passed")
