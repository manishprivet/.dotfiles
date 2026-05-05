-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here
vim.keymap.set(
  "n",
  "<leader>sx",
  require("telescope.builtin").resume,
  { noremap = true, silent = true, desc = "Resume Telescope" }
)

vim.keymap.set("n", "<C-h>", ":<C-U>TmuxNavigateLeft<cr>", { noremap = true, silent = true })
vim.keymap.set("n", "<C-l>", ":<C-U>TmuxNavigateRight<cr>", { noremap = true, silent = true })
vim.keymap.set("n", "<C-j>", ":<C-U>TmuxNavigateDown<cr>", { noremap = true, silent = true })
vim.keymap.set("n", "<C-k>", ":<C-U>TmuxNavigateUp<cr>", { noremap = true, silent = true })
vim.keymap.set("n", "<C-\\>", ":<C-U>TmuxNavigatePrevious<cr>", { noremap = true, silent = true })

vim.keymap.set(
  "n",
  "<leader>bX",
  ":%bd|e#|bd#<cr>",
  { noremap = true, silent = true, desc = "Close all buffers except current one" }
)

vim.api.nvim_set_keymap("i", "<C-f>", 'copilot#Accept("<CR>")', { expr = true, silent = true, noremap = true })
