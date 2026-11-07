-- Retain native integration without enabling conflicting desktop presets.
require("default.hypr.bindings.media")
require("default.hypr.bindings.clipboard")
require("default.hypr.bindings.input-method")
require("default.hypr.bindings.jis")

-- Four explicit essentials, plus the Mac's Alt-based window management.
o.bind("SUPER + RETURN", "Terminal", o.launch_terminal())
o.bind("SUPER + SPACE", "Omarchy menu", { menu = "root" })
o.bind("SUPER + Q", "Close window", hl.dsp.window.close())
o.bind("SUPER + CTRL + L", "Lock", "omarchy system lock")
require("hypr.aerospace").setup()

o.bind("XF86PowerOff", "Power menu", { menu = "system" }, { locked = true })
o.bind("SUPER + CTRL + F", "Toggle fullscreen", hl.dsp.window.fullscreen({ mode = "fullscreen" }))
o.bind("SUPER + SHIFT + L", "Cycle workspace layout", "omarchy-hyprland-workspace-layout-toggle")
o.bind("SUPER + M", "Minimize to dock (floating workspace)", "omarchy-hyprland-window-minimize")
o.bind("SUPER + TAB", "Last focused window", hl.dsp.focus({ last = true }))
o.bind("SUPER + grave", "Next window on workspace", function()
  hl.dispatch(hl.dsp.window.cycle_next())
  hl.dispatch(hl.dsp.window.bring_to_top())
end)
o.bind("SUPER + SHIFT + grave", "Previous window on workspace", function()
  hl.dispatch(hl.dsp.window.alter_zorder({ mode = "bottom" }))
  hl.dispatch(hl.dsp.window.cycle_next({ next = false }))
end)
o.bind("SUPER + mouse:272", "Move window", hl.dsp.window.drag(), { mouse = true })
o.bind("SUPER + mouse:273", "Resize window", hl.dsp.window.resize(), { mouse = true })
o.bind("PRINT", "Screenshot", "omarchy capture screenshot")
o.bind("SUPER + SHIFT + 3", "Screenshot fullscreen", "omarchy capture screenshot fullscreen")
o.bind("SUPER + SHIFT + 4", "Screenshot region", "omarchy capture screenshot region")
o.bind("SUPER + SHIFT + 5", "Capture menu", { menu = "capture" })
o.bind("SUPER + CTRL + SPACE", "Emojis", { panel = "omarchy.emojis" })

local function active_terminal()
  local window = hl.get_active_window()
  for _, tag in ipairs(window and window.tags or {}) do
    if tag:gsub("%*$", "") == "terminal" then return window.class end
  end
  return window and window.class == "com.mitchellh.ghostty" and window.class or nil
end

local function send(mods, key, after)
  -- Explicit down/up delivery avoids stuck synthetic keys.
  hl.dispatch(hl.dsp.send_key_state({ mods = mods, key = key, state = "down" }))
  hl.timer(function()
    hl.dispatch(hl.dsp.send_key_state({ mods = mods, key = key, state = "up" }))
    if after then after() end
  end, { timeout = 50, type = "oneshot" })
end

-- GUI apps use Ctrl. Ghostty has a few native Ctrl+Shift equivalents; never
-- translate arbitrary terminal chords (Ctrl+S freezes output, Ctrl+Z suspends).
local function shortcut(mods, key, terminal_mods, terminal_key)
  return function()
    local terminal = active_terminal()
    if terminal then
      if terminal == "com.mitchellh.ghostty" and terminal_mods then
        send(terminal_mods, terminal_key or key)
      else
        hl.dispatch(hl.dsp.pass())
      end
    else
      send(mods, key)
    end
  end
end

-- Override native select-all only to use Ghostty's actual select-all action.
o.rebind("SUPER + A", "Select all", shortcut("CTRL", "A", "CTRL SHIFT"))
for _, spec in ipairs({
  { "T", "New tab", "CTRL", "T", "CTRL SHIFT" },
  { "SHIFT + T", "Reopen closed tab", "CTRL SHIFT", "T" },
  { "W", "Close tab", "CTRL", "W", "CTRL SHIFT" },
  { "N", "New window/document", "CTRL", "N", "CTRL SHIFT" },
  { "SHIFT + N", "Incognito window/new folder", "CTRL SHIFT", "N" },
  { "L", "Address bar", "CTRL", "L" },
  { "F", "Find", "CTRL", "F", "CTRL SHIFT" },
  { "R", "Reload", "CTRL", "R" },
  { "SHIFT + R", "Reload without cache", "CTRL SHIFT", "R" },
  { "Z", "Undo", "CTRL", "Z" },
  { "SHIFT + Z", "Redo", "CTRL SHIFT", "Z" },
  { "S", "Save", "CTRL", "S" },
  { "O", "Open", "CTRL", "O" },
  { "P", "Print", "CTRL", "P" },
  { "D", "Bookmark", "CTRL", "D" },
  { "equal", "Zoom in", "CTRL", "KP_Add", "CTRL", "equal" },
  { "SHIFT + equal", "Zoom in", "CTRL", "KP_Add", "CTRL", "equal" },
  { "minus", "Zoom out", "CTRL", "minus", "CTRL" },
  { "0", "Reset zoom", "CTRL", "0", "CTRL" },
  { "bracketleft", "Back", "ALT", "Left" },
  { "bracketright", "Forward", "ALT", "Right" },
  { "SHIFT + bracketleft", "Previous tab", "CTRL SHIFT", "Tab", "CTRL SHIFT" },
  { "SHIFT + bracketright", "Next tab", "CTRL", "Tab", "CTRL" },
  { "ALT + Left", "Previous tab", "CTRL SHIFT", "Tab", "CTRL SHIFT" },
  { "ALT + Right", "Next tab", "CTRL", "Tab", "CTRL" },
}) do
  o.bind("SUPER + " .. spec[1], spec[2], shortcut(spec[3], spec[4], spec[5], spec[6]))
end
for index = 1, 9 do
  local key = tostring(index)
  o.bind("SUPER + " .. key, "Tab " .. key, shortcut("CTRL", key, "ALT"))
end

-- Mac text navigation in GUI apps, including Shift to extend the selection.
-- Ghostty's Shift+Home/End scrolls history; use Ctrl+Shift for TUI selection.
for _, spec in ipairs({
  { "SUPER + Left", "Line start", "", "Home", "", "CTRL SHIFT" },
  { "SUPER + Right", "Line end", "", "End", "", "CTRL SHIFT" },
  { "SUPER + Up", "Document start", "CTRL", "Home", "CTRL" },
  { "SUPER + Down", "Document end", "CTRL", "End", "CTRL" },
  { "ALT + Left", "Previous word", "CTRL", "Left" },
  { "ALT + Right", "Next word", "CTRL", "Right" },
}) do
  o.bind(spec[1], spec[2], shortcut(spec[3], spec[4], spec[5]))
  o.bind("SHIFT + " .. spec[1], "Select to " .. spec[2]:lower(), shortcut(spec[3] .. " SHIFT", spec[4], spec[6]))
end
o.bind("ALT + BackSpace", "Delete previous word", shortcut("CTRL", "BackSpace"))
o.bind("ALT + Delete", "Delete next word", shortcut("CTRL", "Delete"))
for _, spec in ipairs({ { "BackSpace", "Home" }, { "Delete", "End" } }) do
  o.bind("SUPER + " .. spec[1], "Delete to line " .. (spec[2] == "Home" and "start" or "end"), function()
    if active_terminal() then
      hl.dispatch(hl.dsp.pass())
    else
      send("SHIFT", spec[2], function() send("", spec[1]) end)
    end
  end)
end
