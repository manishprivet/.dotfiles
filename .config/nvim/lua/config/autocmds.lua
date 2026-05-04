-- Autocmds are automatically loaded on the VeryLazy event
-- Default autocmds that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua
-- Add any additional autocmds here

----- zellij status line integration https://github.com/dj95/zjstatus
local bottom_bar = require("config.zellij_status.bottom")
local top_bar = require("config.zellij_status.top")

local function send_zellij_pipe(payload)
  vim.fn.system({ "zellij", "pipe", payload })
end

local zellij_status_tabs_generation = 0
local function request_zellij_status_update(delay, callback)
  local generation = zellij_status_tabs_generation
  vim.defer_fn(function()
    if generation ~= zellij_status_tabs_generation then
      return
    end
    callback()
  end, delay or 0)
end

local function request_zellij_status_tabs_update(delay)
  request_zellij_status_update(delay, update_zellij_status_tabs)
end

local function request_zellij_status_lualine_update(delay)
  request_zellij_status_update(delay, bottom_bar.update_slow)
end

local function request_zellij_status_lualine_fast_update(delay)
  request_zellij_status_update(delay, bottom_bar.update_fast)
end

local function clear_zellij_status_tabs(invalidate_generation)
  if invalidate_generation then
    zellij_status_tabs_generation = zellij_status_tabs_generation + 1
  end
  top_bar.clear()
end

local function clear_zellij_status()
  zellij_status_tabs_generation = zellij_status_tabs_generation + 1
  clear_zellij_status_tabs(false)
  bottom_bar.clear_all()
end

function update_zellij_status_tabs()
  top_bar.update()
end

local function update_zellij_status()
  update_zellij_status_tabs()
  bottom_bar.update_all()
end

local function has_current_zellij_session()
  return vim.env.ZELLIJ ~= nil and vim.env.ZELLIJ ~= ""
end

if has_current_zellij_session() then
  vim.opt.showtabline = 0 -- hide tabs
  vim.api.nvim_create_user_command("ZellijStatusRefresh", update_zellij_status, {})
  vim.api.nvim_create_user_command("ZellijStatusDebug", function()
    if not bottom_bar.config.debug then
      return
    end
    send_zellij_pipe("zjstatus::notify::Neovim pipe reached zjstatus")
    update_zellij_status()
  end, {})
  vim.api.nvim_create_autocmd({
    "VimEnter",
    "TabEnter",
    "TabClosed",
    "BufAdd",
    "BufEnter",
    "BufDelete",
    "BufNew",
    "BufWinEnter",
    "BufWipeout",
    "FocusGained",
  }, {
    callback = function(args)
      local delay = args.event == "FocusGained" and 80 or 0
      request_zellij_status_tabs_update(delay)
    end,
  })
  vim.api.nvim_create_autocmd({
    "VimEnter",
    "BufEnter",
    "BufModifiedSet",
    "BufWinEnter",
    "CmdlineChanged",
    "CmdlineEnter",
    "CmdlineLeave",
    "DiagnosticChanged",
    "LspAttach",
    "ModeChanged",
    "RecordingEnter",
    "RecordingLeave",
    "TermEnter",
    "WinEnter",
    "FocusGained",
  }, {
    callback = function(args)
      local delay = args.event == "FocusGained" and 80 or 0
      request_zellij_status_lualine_update(delay)
    end,
  })
  vim.api.nvim_create_autocmd({
    "VimEnter",
    "BufEnter",
    "BufWinEnter",
    "CursorHold",
    "CursorHoldI",
    "CursorMoved",
    "LspAttach",
    "WinEnter",
    "FocusGained",
  }, {
    callback = function(args)
      if args.event == "CursorMoved" then
        local mode = vim.api.nvim_get_mode().mode
        if mode ~= "v" and mode ~= "V" and mode ~= "\22" then
          return
        end
      end
      local delay = args.event == "FocusGained" and 80 or 0
      request_zellij_status_lualine_fast_update(delay)
    end,
  })
  vim.api.nvim_create_autocmd("VimEnter", {
    callback = function()
      request_zellij_status_lualine_update(120)
      request_zellij_status_lualine_update(400)
      request_zellij_status_lualine_fast_update(120)
      request_zellij_status_lualine_fast_update(400)
    end,
  })
  vim.api.nvim_create_autocmd({ "BufEnter", "BufWinEnter", "LspAttach" }, {
    callback = function()
      request_zellij_status_lualine_update(120)
      request_zellij_status_lualine_update(350)
      request_zellij_status_lualine_fast_update(120)
      request_zellij_status_lualine_fast_update(350)
    end,
  })
  vim.api.nvim_create_autocmd("User", {
    pattern = "GitSignsUpdate",
    callback = function()
      request_zellij_status_lualine_update(0)
    end,
  })
  vim.api.nvim_create_autocmd({ "FocusLost", "VimSuspend" }, {
    callback = clear_zellij_status,
  })
  vim.api.nvim_create_autocmd("VimLeave", {
    callback = clear_zellij_status,
  })
  vim.schedule(update_zellij_status)
else
  vim.opt.showtabline = 1
end
