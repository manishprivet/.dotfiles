local config = require("config.zellij_status.top.config")

local M = {}

local parts = {
  require("config.zellij_status.top.parts.tabs"),
}

local last_message = nil

local function send(payload)
  vim.fn.system({ "zellij", "pipe", "zjstatus::pipe::pipe_neovim_top_tabs::" .. (payload or "") })
end

function M.update()
  local visible = {}
  for _, part in ipairs(parts) do
    if config.enabled[part.id] ~= false then
      local value = part.render()
      if value and value ~= "" then
        table.insert(visible, value)
      end
    end
  end

  local message = table.concat(visible, "")
  if message == "" then
    M.clear()
    return
  end
  if message == last_message then
    return
  end

  last_message = message
  send(message)
end

function M.clear()
  if last_message == "" then
    return
  end
  last_message = ""
  send()
end

return M
