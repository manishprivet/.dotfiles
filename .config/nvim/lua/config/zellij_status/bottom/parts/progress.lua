return {
  id = "progress",
  render = function()
    local current = vim.fn.line(".")
    local total = vim.fn.line("$")
    if total <= 1 then
      return "100%"
    end
    local percent = math.floor(((current - 1) / (total - 1)) * 100 + 0.5)
    return string.format("%d%%", percent)
  end,
}
