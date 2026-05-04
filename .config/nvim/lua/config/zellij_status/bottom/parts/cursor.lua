local fmt = require("config.zellij_status.format")
local palette = require("config.zellij_status.palette")

return {
  id = "cursor",
  render = function(ctx)
    local color = palette.cursor
    if ctx and ctx.inactive then
      color = palette.inactive.accent
    end

    return fmt.hl(string.format("%d:%d", vim.fn.line("."), vim.fn.col(".")), { fg = color, bg = palette.bg })
  end,
}
