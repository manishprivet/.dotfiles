-- App placement is independent of the keybindings and uses Omarchy's slots.
local M = {}

function M.workspace_for_class(class)
  class = (class or ""):lower()
  if class:match("^chrome%-calendar%.google%.com") or class:match("^chrome%-calendar%.notion%.so") or class == "notion-calendar" then
    return 1
  elseif class == "com.mitchellh.ghostty" or class == "com.superlogical.rex" or class == "rex" then
    return 2
  elseif class == "slack" or class == "discord" or class == "org.telegram.desktop" or class == "telegram-desktop"
      or class:match("^chrome%-app%.slack%.com") or class:match("^chrome%-web%.whatsapp%.com")
      or class:match("^chrome%-web%.telegram%.org") or class:match("^chrome%-discord%.com") then
    return 4
  elseif class == "com.github.th-ch.youtube-music" or class == "youtube-music"
      or class:match("^chrome%-music%.youtube%.com") then
    return 5
  elseif class == "obsidian" or class == "md.obsidian" or class == "notion"
      or class:match("^chrome%-www%.notion%.so") or class:match("^chrome%-notion%.so") then
    return 5
  elseif class == "google-chrome" or class == "google-chrome-stable" or class == "chromium"
      or class == "chromium-browser" or class == "firefox" or class == "zen" or class == "librewolf"
      or class == "brave-browser" or class == "helium" then
    return 3
  end
end

function M.setup()
  hl.on("window.open", function(window)
    if not window or window.floating or not window.monitor or not window.workspace or window.workspace.id <= 0 then return end
    local slot = M.workspace_for_class(window.class)
    if not slot then return end
    local workspace = o.workspaces.workspace_id(window.monitor, slot)
    if workspace ~= window.workspace.id then
      hl.dispatch(hl.dsp.window.move({ window = "address:" .. window.address, workspace = tostring(workspace), follow = false }))
    end
  end)
end

return M
