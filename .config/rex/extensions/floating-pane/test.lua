-- Run from the repo root with lua. No server connection or filesystem mutation.
local action, calls, scratch, failure
local window = {
    window_id = "tab",
    focused_block_id = "editor",
    layers = {
        { kind = "tiled", blocks = { { block_id = "editor" } } },
        { kind = "floating", layer_id = "drawer", blocks = { { block_id = "scratch" } } },
    },
}
local function record(name)
    return function(args)
        calls[#calls + 1] = { name = name, args = args }
        if failure == name then return nil, "failed " .. name end
        return {}
    end
end
rex = {
    action = function(value) action = value.run end,
    bind = function(key, name)
        assert(key == "ctrl+s>f" and name == "toggle_floating_pane")
    end,
    session = {
        view = function()
            return { active_window_id = "tab", windows = { { window_id = "other" }, window } }
        end,
        list_blocks = function() return { blocks = scratch and { scratch } or {} } end,
        set_layer_state = record("state"),
        move_block = record("move"),
        float_block = record("float"),
        detach_block = record("detach"),
        focus_block = record("focus"),
        new_layer = record("new"),
    },
    block = { call = function() return { foreground = { cwd = "/project" } } end },
    client = { queue = function(name, args)
        assert(name == "pane.minimize_floating")
        record("minimize")(args)
    end },
    layout = { block = function(args) return args end },
}
dofile(".config/rex/extensions/floating-pane/init.lua")
local function toggle()
    calls = {}
    return action({ session_id = "session" })
end

scratch = { block_id = "scratch", label = "scratch:tab", placement = "placed" }
toggle()
assert(#calls == 2 and calls[1].name == "focus" and calls[2].name == "minimize")
assert(calls[1].args.session_id == "session" and calls[1].args.block_id == "scratch")

failure = "focus"
local ok, err = pcall(toggle)
assert(not ok and err == "failed focus" and #calls == 1)
failure = nil

window.layers[2].state = "minimized"
toggle()
assert(#calls == 1 and calls[1].name == "state")
assert(calls[1].args.session_id == "session" and calls[1].args.layer_id == "drawer")
assert(calls[1].args.state == "normal" and calls[1].args.focus == true)

failure = "state"
ok, err = pcall(toggle)
assert(not ok and err == "failed state" and #calls == 1)
failure = nil

-- A pane hidden by the old implementation is restored without a new shell.
window.layers[2] = nil
scratch.placement = "detached"
toggle()
assert(#calls == 3)
assert(calls[1].name == "move" and calls[1].args.anchor_block_id == "editor")
assert(calls[2].name == "float" and calls[2].args.block_id == "scratch")
assert(calls[3].name == "focus" and calls[3].args.block_id == "scratch")

failure = "float"
ok, err = pcall(toggle)
assert(not ok and err == "failed float")
assert(#calls == 3 and calls[3].name == "detach")
failure = nil

scratch = nil
toggle()
assert(#calls == 1 and calls[1].name == "new")
assert(calls[1].args.window_id == "tab" and calls[1].args.focus == true)
assert(calls[1].args.layout.label == "scratch:tab")
assert(calls[1].args.layout.options.cwd == "/project")
assert(table.concat(calls[1].args.bounds, ",") == "0.6,0,0.4,1")
print("floating-pane tests passed")
