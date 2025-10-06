-- Options are automatically loaded before lazy.nvim startup
-- Default options that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua
-- Add any additional options here

vim.opt.winbar = "%=%m %f"
-- vim.opt.colorcolumn = "80"
vim.opt.scrolloff = 10
vim.opt.incsearch = true

vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv")
vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv")

vim.keymap.set("x", "<leader>p", "\"_dP")

if vim.g.neovide then
  vim.o.guifont = "JetBrainsMono Nerd Font:h19"
end

-- Disable arrow keys
for _, mode in pairs({ 'n', 'i', 'v', 'x' }) do
    for _, key in pairs({ '<Up>', '<Down>', '<Left>', '<Right>' }) do
        vim.keymap.set(mode, key, '<nop>')
    end
end

vim.cmd
[[
    augroup change_cursor
        au!
        au ExitPre * :set guicursor=a:ver90
    augroup END
]]

vim.g.autoformat = false

vim.g.lazyvim_picker = "telescope"
