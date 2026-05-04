return {
  id = "branch",
  render = function()
    return vim.b.gitsigns_head or ""
  end,
}
