-- Run from the repo root: lua scripts/test_hyprland.lua
-- Test the personal config without touching a running compositor.
local binds, events, dispatched = {}, {}, {}
local submap = ""
local function action(name)
  return function(args) return { name = name, args = args } end
end

hl = {
  dsp = {
    focus = action("focus"), layout = action("layout"), submap = action("submap"),
    exec_cmd = action("exec"),
    window = { move = action("move"), float = action("float"), close = action("close") },
    group = { toggle = action("group_toggle") },
  },
  dispatch = function(value) dispatched[#dispatched + 1] = value end,
  define_submap = function(name, callback)
    submap = name
    callback()
    submap = ""
  end,
  on = function(name, callback) events[name] = callback end,
  get_active_workspace = function() return { id = 2 } end,
}
o = {
  bind = function(keys, description, dispatcher)
    local id = submap .. ":" .. keys
    assert(not binds[id], "Duplicate binding: " .. id)
    binds[id] = { description = description, dispatcher = dispatcher }
  end,
  rebind = function(keys, description, dispatcher)
    binds[submap .. ":" .. keys] = nil
    o.bind(keys, description, dispatcher)
  end,
  workspaces = {
    focus = action("workspace_focus"), move_window = action("workspace_move"),
    move_to_monitor = action("workspace_monitor"),
    workspace_id = function(monitor, slot) return (monitor.block or 0) * 10 + slot end,
  },
  workspace_mode = function(spec) dispatched[#dispatched + 1] = { name = "workspace_mode", args = spec } end,
  launch_terminal = action("launch_terminal"),
}

local aerospace = dofile("omarchy/.config/hypr/aerospace.lua")
aerospace.setup()
assert(#dispatched == 0, "Loading config must not move windows or workspaces")
for _, key in ipairs({ "H", "J", "K", "L" }) do
  assert(binds[":ALT + " .. key])
  assert(binds[":ALT + SHIFT + " .. key])
end
for slot, key in ipairs({ "Q", "W", "E", "R", "T", "Y", "U", "I", "O" }) do
  assert(binds[":ALT + " .. key].dispatcher.args == slot)
  assert(binds[":ALT + SHIFT + " .. key].dispatcher.args == slot)
end
assert(binds[":ALT + 7"].dispatcher.args == 7)
assert(binds[":ALT + TAB"].dispatcher.args.workspace == "previous_per_monitor")
assert(binds["aerospace-service:escape"])
assert(binds["aerospace-service:catchall"])
assert(not binds["aerospace-service:backspace"], "Do not add a destructive close-all shortcut")
for key in pairs(binds) do
  assert(not key:find("SUPER"), "AeroSpace uses Alt; essentials are configured separately")
end

local workspaces = dofile("omarchy/.config/hypr/workspaces.lua")
workspaces.setup()
assert(workspaces.workspace_for_class("com.mitchellh.ghostty") == 2)
assert(workspaces.workspace_for_class("google-chrome") == 3)
assert(workspaces.workspace_for_class("chrome-discord.com__channels_@me-Default") == 4)
assert(workspaces.workspace_for_class("obsidian") == 5)
assert(workspaces.workspace_for_class("chrome-calendar.google.com__-Default") == 1)
assert(workspaces.workspace_for_class("unknown-app") == nil)

local window = { class = "com.mitchellh.ghostty", address = "0x123", monitor = { block = 1 }, workspace = { id = 11 } }
events["window.open"](window)
local move = dispatched[#dispatched]
assert(move.name == "move" and move.args.workspace == "12" and move.args.follow == false)
assert(move.args.window == "address:0x123")
local count = #dispatched
window.floating = true
events["window.open"](window)
window.floating = false
window.workspace.id = -1
events["window.open"](window)
assert(#dispatched == count, "Floating windows and scratchpads must stay put")

binds["aerospace-service:F"].dispatcher()
assert(dispatched[#dispatched - 1].name == "submap" and dispatched[#dispatched - 1].args == "reset")
assert(dispatched[#dispatched].name == "float")
print("Hyprland Alt bindings, service mode and per-monitor app placement passed")

local appearance
hl.config = function(spec) appearance = spec end
dofile("omarchy/.config/hypr/looknfeel.lua")
assert(appearance.general.gaps_in * 2 == 18)
assert(appearance.general.gaps_out.left == 18 and appearance.general.gaps_out.right == 18)
assert(appearance.general.gaps_out.top == 18 and appearance.general.gaps_out.bottom == 10)
assert(appearance.general.border_size == nil and appearance.general.col == nil)
assert(appearance.decoration == nil and appearance.animations == nil)
print("Hyprland spacing passed; Omarchy theme and decorations are not overridden")

-- The main loader must explicitly disable presets but keep native integration.
local file = assert(io.open("omarchy/.config/hypr/hyprland.lua"))
local loader = file:read("*a")
file:close()
assert(loader:find("omarchy_default_bindings = false", 1, true))
assert(loader:find('require("default.hypr.omarchy")', 1, true))
print("Native integration is retained without Omarchy's preset bindings")
package.loaded["hypr.aerospace"] = { setup = function() end }
dofile("omarchy/.config/hypr/bindings.lua")
for _, key in ipairs({ "SUPER + RETURN", "SUPER + SPACE", "SUPER + W", "SUPER + CTRL + L" }) do
  assert(binds[":" .. key], "Missing explicit essential: " .. key)
end
print("The four explicit essential shortcuts are present")
