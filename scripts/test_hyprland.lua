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
local workspaces = dofile("omarchy/.config/hypr/workspaces.lua")
workspaces.setup()

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
print("Hyprland service mode and per-monitor placement passed")

package.loaded["hypr.aerospace"] = { setup = function() end }
for _, name in ipairs({ "media", "clipboard", "input-method", "jis" }) do
  package.preload["default.hypr.bindings." .. name] = function()
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
  check_shortcut("SHIFT + SUPER + Left", " SHIFT", "Home")
  check_shortcut("SHIFT + SUPER + Right", " SHIFT", "End")
  check_shortcut("SUPER + Up", "CTRL", "Home")
  check_shortcut("SUPER + Down", "CTRL", "End")
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
check_shortcut("SUPER + Left", "", "Home")
check_shortcut("SUPER + Right", "", "End")
check_shortcut("SHIFT + SUPER + Left", "CTRL SHIFT", "Home")
check_shortcut("SHIFT + SUPER + Right", "CTRL SHIFT", "End")
check_shortcut("SUPER + Up", "CTRL", "Home")
check_shortcut("SUPER + Down", "CTRL", "End")
for _, chord in ipairs({ "SUPER + S", "SUPER + Z", "SUPER + R", "SUPER + D", "SUPER + BackSpace", "ALT + Left", "SUPER + SHIFT + N", "SHIFT + SUPER + Up", "SHIFT + SUPER + Down" }) do
  check_passthrough(chord)
end
active_window = { class = "another-terminal", tags = { "terminal*" } }
check_passthrough("SUPER + T")
check_passthrough("SUPER + Left")
check_passthrough("SUPER + Right")
check_passthrough("SHIFT + SUPER + Left")
check_passthrough("SHIFT + SUPER + Right")
check_passthrough("SUPER + Up")
check_passthrough("SUPER + Down")
active_window = { class = "com.mitchellh.ghostty" }
check_shortcut("SUPER + T", "CTRL SHIFT", "T")
check_shortcut("SUPER + Left", "", "Home")
check_shortcut("SUPER + Right", "", "End")
active_window = nil
check_shortcut("SUPER + F", "CTRL", "F")
assert(#timers == 0, "Every synthetic key press must have a matching release")
print("Mac GUI shortcuts, Ghostty equivalents, terminal safety and paired synthetic keys passed")
