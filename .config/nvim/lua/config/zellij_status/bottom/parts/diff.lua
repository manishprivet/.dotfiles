local fmt = require("config.zellij_status.format")
local palette = require("config.zellij_status.palette")

return {
  id = "diff",
  render = function()
    local gitsigns = vim.b.gitsigns_status_dict
    if type(gitsigns) ~= "table" then
      return ""
    end

    local bg = palette.bg
    local parts = {}
    if (gitsigns.added or 0) > 0 then
      table.insert(parts, fmt.hl(" " .. gitsigns.added, { fg = palette.git.added, bg = bg }))
    end
    if (gitsigns.changed or 0) > 0 then
      table.insert(parts, fmt.hl(" " .. gitsigns.changed, { fg = palette.git.changed, bg = bg }))
    end
    if (gitsigns.removed or 0) > 0 then
      table.insert(parts, fmt.hl(" " .. gitsigns.removed, { fg = palette.git.removed, bg = bg }))
    end

    return table.concat(parts, " ")
  end,
}
