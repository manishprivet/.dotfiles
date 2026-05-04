local fmt = require("config.zellij_status.format")
local helpers = require("config.zellij_status.bottom.helpers")
local palette = require("config.zellij_status.palette")

return {
  id = "root",
  render = function()
    local root, cwd = helpers.current_root_info()
    if type(root) ~= "string" or root == "" or root == cwd then
      return ""
    end
    return fmt.hl("󱉭 ", { fg = palette.root, bg = palette.bg })
      .. fmt.hl(vim.fs.basename(root), { fg = palette.text, bg = palette.bg })
  end,
}
