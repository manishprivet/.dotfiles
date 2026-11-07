-- AeroSpace-style workflow for Omarchy's Lua-based Hyprland configuration.
-- macOS's original remains in .config/aerospace/aerospace.toml.
local M = {}

function M.setup()
  local directions = { { "H", "l", "left" }, { "J", "d", "down" }, { "K", "u", "up" }, { "L", "r", "right" } }
  for _, direction in ipairs(directions) do
    local key, axis, label = direction[1], direction[2], direction[3]
    o.bind("ALT + " .. key, "AeroSpace: focus " .. label, hl.dsp.focus({ direction = axis }))
    -- Consumes Alt+Shift+L before a browser can use it for Copy URL.
    o.rebind("ALT + SHIFT + " .. key, "AeroSpace: move window " .. label, hl.dsp.window.move({ direction = axis }))
  end

  -- Keep Omarchy's per-monitor workspace slots, including move-and-follow.
  local keys = { "Q", "W", "E", "R", "T", "Y", "U", "I", "O" }
  for slot, key in ipairs(keys) do
    o.bind("ALT + " .. key, "AeroSpace: workspace " .. slot, o.workspaces.focus(slot))
    o.bind("ALT + SHIFT + " .. key, "AeroSpace: move and follow to workspace " .. slot, o.workspaces.move_window(slot))
  end
  -- The Mac config uses Alt+7 but Alt+Shift+U for workspace 7. Support both.
  o.bind("ALT + 7", "AeroSpace: workspace 7 (Mac alias)", o.workspaces.focus(7))

  -- Replace both of Omarchy's actions registered on each Tab chord.
  o.rebind("ALT + TAB", "AeroSpace: previous workspace", hl.dsp.focus({ workspace = "previous_per_monitor" }))
  o.rebind("ALT + SHIFT + TAB", "AeroSpace: move workspace to next monitor", o.workspaces.move_to_monitor("+1"))

  -- Hyprland equivalents, not exact copies of AeroSpace's container layouts.
  o.bind("ALT + slash", "AeroSpace: toggle tile orientation", hl.dsp.layout("togglesplit"))
  o.bind("ALT + comma", "AeroSpace: toggle tabbed group (accordion alternative)", hl.dsp.group.toggle())
  -- A relative split ratio follows the current split's axis, unlike fixed x/y resizing.
  o.bind("ALT + SHIFT + minus", "AeroSpace: shrink split", hl.dsp.layout("splitratio -0.05"), { repeating = true })
  o.bind("ALT + SHIFT + equal", "AeroSpace: grow split", hl.dsp.layout("splitratio +0.05"), { repeating = true })

  o.bind("ALT + SHIFT + semicolon", "AeroSpace: service mode", hl.dsp.submap("aerospace-service"))
  hl.define_submap("aerospace-service", function()
    local function once(dispatcher)
      return function()
        hl.dispatch(hl.dsp.submap("reset"))
        if type(dispatcher) == "function" then
          dispatcher()
        else
          hl.dispatch(dispatcher)
        end
      end
    end
    o.bind("escape", "AeroSpace: reload and exit service mode", once(hl.dsp.exec_cmd("hyprctl reload")))
    o.bind("F", "AeroSpace: toggle floating and exit", once(hl.dsp.window.float({ action = "toggle" })))
    o.bind("R", "AeroSpace: reset workspace to tiling and exit", once(function()
      local workspace = hl.get_active_workspace()
      if workspace and workspace.id > 0 then
        o.workspace_mode({ workspace = tostring(workspace.id), mode = "dwindle" })
      end
    end))
    for _, direction in ipairs(directions) do
      o.bind("ALT + SHIFT + " .. direction[1], "AeroSpace: join group " .. direction[3] .. " and exit",
        once(hl.dsp.window.move({ into_or_create_group = direction[2] })))
    end
    -- Deliberately omit the destructive close-all-but-current shortcut.
    o.bind("catchall", "AeroSpace: exit service mode", hl.dsp.submap("reset"))
  end)
end

return M
