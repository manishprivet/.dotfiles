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
    exec_cmd = action("exec"), pass = action("pass"),
    window = {
      move = action("move"), float = action("float"), close = action("close"),
      fullscreen = action("fullscreen"), cycle_next = action("cycle_next"),
      bring_to_top = action("bring_to_top"), alter_zorder = action("alter_zorder"),
      drag = action("drag"), resize = action("resize"),
    },
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
  bind = function(keys, description, dispatcher, options)
    local id = submap .. ":" .. keys
    assert(not binds[id], "Duplicate binding: " .. id)
    binds[id] = { description = description, dispatcher = dispatcher, options = options or {} }
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
assert(binds[":ALT + SHIFT + minus"].dispatcher.args == "splitratio -0.05")
assert(binds[":ALT + SHIFT + equal"].dispatcher.args == "splitratio +0.05")
assert(binds[":ALT + SHIFT + minus"].options.repeating)
assert(binds[":ALT + SHIFT + equal"].options.repeating)
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
local native_loaded = {}
for _, name in ipairs({ "media", "clipboard", "input-method", "jis" }) do
  package.preload["default.hypr.bindings." .. name] = function()
    native_loaded[name] = true
    if name == "clipboard" then
      -- The personal select-all override must replace, not duplicate, this bind.
      o.bind("SUPER + A", "Native select all", action("native_select_all")())
    end
    return true
  end
end
local before_load = #dispatched
dofile("omarchy/.config/hypr/bindings.lua")
assert(#dispatched == before_load, "Loading bindings must not execute desktop actions")
for _, name in ipairs({ "media", "clipboard", "input-method", "jis" }) do
  assert(native_loaded[name], "Missing native integration: " .. name)
end
print("Native media, clipboard and input-method controls load without enabling desktop presets")
for _, key in ipairs({ "SUPER + RETURN", "SUPER + SPACE", "SUPER + Q", "SUPER + CTRL + L" }) do
  assert(binds[":" .. key], "Missing explicit essential: " .. key)
end
print("The four explicit essential shortcuts are present")
assert(binds[":SUPER + Q"].dispatcher.name == "close", "Super+Q must close the focused window")
assert(binds[":XF86PowerOff"].dispatcher.menu == "system" and binds[":XF86PowerOff"].options.locked)
assert(binds[":SUPER + CTRL + F"].dispatcher.name == "fullscreen")
assert(binds[":SUPER + SHIFT + L"].dispatcher == "omarchy-hyprland-workspace-layout-toggle")
assert(binds[":SUPER + TAB"].dispatcher.args.last)
assert(binds[":SUPER + mouse:272"].options.mouse and binds[":SUPER + mouse:273"].options.mouse)
assert(binds[":SUPER + SHIFT + 3"].dispatcher == "omarchy capture screenshot fullscreen")
assert(binds[":SUPER + SHIFT + 4"].dispatcher == "omarchy capture screenshot region")
assert(binds[":SUPER + SHIFT + 5"].dispatcher.menu == "capture")
for key in pairs(binds) do
  assert(not key:find("switch:", 1, true), "Do not change the working lid handling")
end

local active_window, timers = nil, {}
hl.get_active_window = function() return active_window end
hl.dsp.send_key_state = action("send_key_state")
hl.timer = function(callback, options)
  assert(options.timeout == 50 and options.type == "oneshot")
  timers[#timers + 1] = callback
end

local function check_shortcut(chord, mods, key)
  local before = #dispatched
  binds[":" .. chord].dispatcher()
  assert(#dispatched == before + 1)
  local down = dispatched[#dispatched]
  assert(down.name == "send_key_state")
  assert(down.args.mods == mods and down.args.key == key and down.args.state == "down")
  table.remove(timers, 1)()
  local up = dispatched[#dispatched]
  assert(up.name == "send_key_state")
  assert(up.args.mods == mods and up.args.key == key and up.args.state == "up")
end

for _, class in ipairs({ "google-chrome", "chromium", "firefox", "obsidian", "chrome-discord.com__channels_@me-Default" }) do
  active_window = { class = class }
  for _, key in ipairs({ "A", "T", "N", "L", "F", "R", "W", "Z", "S", "O", "P", "D" }) do
    check_shortcut("SUPER + " .. key, "CTRL", key)
  end
  for _, key in ipairs({ "T", "N", "R", "Z" }) do
    check_shortcut("SUPER + SHIFT + " .. key, "CTRL SHIFT", key)
  end
  check_shortcut("SUPER + equal", "CTRL", "KP_Add")
  check_shortcut("SUPER + bracketleft", "ALT", "Left")
  check_shortcut("SUPER + bracketright", "ALT", "Right")
  check_shortcut("SUPER + SHIFT + bracketleft", "CTRL SHIFT", "Tab")
  check_shortcut("SUPER + SHIFT + bracketright", "CTRL", "Tab")
  check_shortcut("SUPER + 1", "CTRL", "1")
  check_shortcut("SUPER + Left", "", "Home")
  check_shortcut("SHIFT + SUPER + Up", "CTRL SHIFT", "Home")
  check_shortcut("ALT + Right", "CTRL", "Right")
  check_shortcut("ALT + BackSpace", "CTRL", "BackSpace")
  local before = #dispatched
  binds[":SUPER + BackSpace"].dispatcher()
  assert(dispatched[#dispatched].args.key == "Home")
  table.remove(timers, 1)()
  assert(dispatched[#dispatched - 1].args.state == "up")
  assert(dispatched[#dispatched].args.key == "BackSpace" and dispatched[#dispatched].args.state == "down")
  table.remove(timers, 1)()
  assert(#dispatched == before + 4 and dispatched[#dispatched].args.state == "up")
end

local function check_passthrough(chord)
  local before = #dispatched
  binds[":" .. chord].dispatcher()
  assert(#dispatched == before + 1 and dispatched[#dispatched].name == "pass", "Terminal chord must pass through: " .. chord)
  assert(#timers == 0)
end
active_window = { class = "com.mitchellh.ghostty", tags = { "terminal*" } }
for _, key in ipairs({ "A", "T", "N", "W", "F" }) do
  check_shortcut("SUPER + " .. key, "CTRL SHIFT", key)
end
check_shortcut("SUPER + 2", "ALT", "2")
check_shortcut("SUPER + equal", "CTRL", "equal")
for _, chord in ipairs({ "SUPER + S", "SUPER + Z", "SUPER + R", "SUPER + D", "SUPER + BackSpace", "ALT + Left", "SUPER + SHIFT + N" }) do
  check_passthrough(chord)
end
active_window = { class = "another-terminal", tags = { "terminal*" } }
check_passthrough("SUPER + T")
active_window = { class = "com.mitchellh.ghostty" }
check_shortcut("SUPER + T", "CTRL SHIFT", "T")
active_window = nil
check_shortcut("SUPER + F", "CTRL", "F")
assert(#timers == 0, "Every synthetic key press must have a matching release")
print("Mac GUI shortcuts, Ghostty equivalents, terminal safety and paired synthetic keys passed")
