local fmt = require("config.zellij_status.format")
local palette = require("config.zellij_status.palette")

return {
  id = "diagnostics",
  render = function()
    local bg = palette.bg
    local bufnr = vim.api.nvim_get_current_buf()
    local counts = {
      error = #vim.diagnostic.get(bufnr, { severity = vim.diagnostic.severity.ERROR }),
      warn = #vim.diagnostic.get(bufnr, { severity = vim.diagnostic.severity.WARN }),
      info = #vim.diagnostic.get(bufnr, { severity = vim.diagnostic.severity.INFO }),
      hint = #vim.diagnostic.get(bufnr, { severity = vim.diagnostic.severity.HINT }),
    }

    local parts = {}
    if counts.error > 0 then
      table.insert(parts, fmt.hl(" " .. counts.error, { fg = palette.diagnostics.error, bg = bg }))
    end
    if counts.warn > 0 then
      table.insert(parts, fmt.hl(" " .. counts.warn, { fg = palette.diagnostics.warn, bg = bg }))
    end
    if counts.info > 0 then
      table.insert(parts, fmt.hl(" " .. counts.info, { fg = palette.diagnostics.info, bg = bg }))
    end
    if counts.hint > 0 then
      table.insert(parts, fmt.hl(" " .. counts.hint, { fg = palette.diagnostics.hint, bg = bg }))
    end

    return table.concat(parts, " ")
  end,
}
