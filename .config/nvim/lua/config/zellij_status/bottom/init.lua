local config = require("config.zellij_status.bottom.config")
local fmt = require("config.zellij_status.format")
local palette = require("config.zellij_status.palette")

local M = {}

local slow_parts = {
  require("config.zellij_status.bottom.parts.mode"),
  require("config.zellij_status.bottom.parts.command"),
  require("config.zellij_status.bottom.parts.input_mode"),
  require("config.zellij_status.bottom.parts.recording"),
  require("config.zellij_status.bottom.parts.branch"),
  require("config.zellij_status.bottom.parts.diff"),
  require("config.zellij_status.bottom.parts.diagnostics"),
  require("config.zellij_status.bottom.parts.root"),
  require("config.zellij_status.bottom.parts.file"),
}

local fast_parts = {
  require("config.zellij_status.bottom.parts.breadcrumbs"),
  require("config.zellij_status.bottom.parts.cursor"),
  require("config.zellij_status.bottom.parts.progress"),
}

local last_messages = {
  slow = nil,
  fast = nil,
}

local function send(pipe_name, payload)
  vim.fn.system({ "zellij", "pipe", "zjstatus::pipe::" .. pipe_name .. "::" .. (payload or "") })
end

local function publish(pipe_name, key, message)
  if message == last_messages[key] then
    return
  end
  last_messages[key] = message
  send(pipe_name, message)
end

local function clear(pipe_name, key)
  if last_messages[key] == "" then
    return
  end
  last_messages[key] = ""
  send(pipe_name)
end

local function render(parts)
  local mode = vim.api.nvim_get_mode().mode
  local is_normal_mode = mode == "n" or mode == "no" or mode == "nov" or mode == "noV" or mode == "no\22"
  local is_fast_pipe = parts == fast_parts
  local colors = palette
  if is_fast_pipe and not is_normal_mode then
    colors = {
      bg = palette.bg,
      text = palette.inactive.text,
      muted = palette.inactive.muted,
      accent = palette.inactive.accent,
    }
  end

  local visible = {}
  for _, part in ipairs(parts) do
    if config.enabled[part.id] ~= false then
      local value = part.render({
        inactive = is_fast_pipe and not is_normal_mode,
        colors = colors,
        palette = palette,
      })
      if value and value ~= "" then
        table.insert(visible, value)
      end
    end
  end

  local message = ""
  for index, part in ipairs(visible) do
    local color = index == 1 and colors.accent or colors.text
    message = message
      .. fmt.hl(" | ", { fg = colors.muted, bg = colors.bg })
      .. fmt.hl(part, { fg = color, bg = colors.bg, bold = index == 1 })
    if index == #visible then
      message = message .. " "
    end
  end

  return message
end

function M.update_slow()
  publish("pipe_neovim_bottom_slow", "slow", render(slow_parts))
end

function M.update_fast()
  publish("pipe_neovim_bottom_fast", "fast", render(fast_parts))
end

function M.update_all()
  M.update_slow()
  M.update_fast()
end

function M.clear_all()
  clear("pipe_neovim_bottom_slow", "slow")
  clear("pipe_neovim_bottom_fast", "fast")
end

M.config = config

return M
