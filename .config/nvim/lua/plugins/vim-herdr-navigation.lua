return {
  "paulbkim-dev/vim-herdr-navigation",
  enabled = vim.env.HERDR_PANE_ID ~= nil and vim.env.HERDR_PANE_ID ~= "",
  lazy = false,
  -- Declare ownership so LazyVim's default window mappings do not replace these.
  keys = {
    { "<c-h>", desc = "Navigate left (vim/herdr)" },
    { "<c-j>", desc = "Navigate down (vim/herdr)" },
    { "<c-k>", desc = "Navigate up (vim/herdr)" },
    { "<c-l>", desc = "Navigate right (vim/herdr)" },
  },
  config = function(plugin)
    -- Upstream ships an editor script rather than a standard Neovim entrypoint.
    dofile(plugin.dir .. "/editor/nvim.lua")
  end,
}
