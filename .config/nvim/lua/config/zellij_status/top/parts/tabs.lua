local config = require("config.zellij_status.top.config")
local fmt = require("config.zellij_status.format")
local helpers = require("config.zellij_status.top.helpers")
local palette = require("config.zellij_status.palette")

return {
  id = "tabs",
  render = function()
    local current_buf = vim.api.nvim_get_current_buf()
    local buffers = helpers.get_listed_buffers()
    if config.hide_when_single_buffer and #buffers <= 1 then
      return ""
    end

    local message = fmt.hl(" | ", { bg = palette.bg, fg = palette.top.active })
    for idx, buf in ipairs(buffers) do
      local tab_color = buf.bufnr == current_buf and palette.top.active or palette.top.inactive
      local buf_name = (buf.display_name or buf.name):match("^%s*(.-)%s*$")
      buf_name = #buf_name > config.max_label_width and buf_name:sub(1, config.max_label_width - 3) .. "..." or buf_name
      message = message
        .. fmt.hl("█", { bg = palette.bg, fg = tab_color })
        .. fmt.hl(tostring(idx) .. " ", { bg = tab_color, fg = palette.top.text, bold = true })
        .. fmt.hl(" " .. (buf_name ~= "" and buf_name or ("Tab #" .. idx)), {
          bg = palette.top.muted,
          fg = tab_color,
          bold = true,
        })
        .. fmt.hl("█ ", { bg = palette.bg, fg = palette.top.muted })
    end
    return message
  end,
}
