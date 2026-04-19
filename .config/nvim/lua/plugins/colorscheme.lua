-- vim.g.material_style = "deep ocean"
-- vim.g.material_style = "oceanic"
vim.g.material_style = "palenight"
-- vim.g.material_style = "lighter"
-- vim.g.material_style = "darker"

return {
  { "ellisonleao/gruvbox.nvim", priority = 1000, config = true, opts = {
    transparent_mode = true,
  } },
  { "EdenEast/nightfox.nvim" },
  { "tckmn/hotdog.vim" },
  { "marko-cerovac/material.nvim" },
  {
    "neanias/everforest-nvim",
    version = false,
    lazy = false,
    priority = 1000, -- make sure to load this before all the other start plugins
    -- Optional; default configuration will be used if setup isn't called.
    config = function()
      local function set_everforest_terminal_colors()
        vim.g.terminal_color_0 = "#272E33"
        vim.g.terminal_color_1 = "#E67E80"
        vim.g.terminal_color_2 = "#A7C080"
        vim.g.terminal_color_3 = "#DBBC7F"
        vim.g.terminal_color_4 = "#7FBBB3"
        vim.g.terminal_color_5 = "#D699B6"
        vim.g.terminal_color_6 = "#83C092"
        vim.g.terminal_color_7 = "#D3C6AA"
        vim.g.terminal_color_8 = "#859289"
        vim.g.terminal_color_9 = "#E67E80"
        vim.g.terminal_color_10 = "#A7C080"
        vim.g.terminal_color_11 = "#DBBC7F"
        vim.g.terminal_color_12 = "#7FBBB3"
        vim.g.terminal_color_13 = "#D699B6"
        vim.g.terminal_color_14 = "#83C092"
        vim.g.terminal_color_15 = "#D3C6AA"
      end

      vim.o.background = "dark"
      require("everforest").setup({
        background = "hard",
        transparent_background_level = 0,
      })

      local group = vim.api.nvim_create_augroup("everforest_terminal_colors", { clear = true })
      vim.api.nvim_create_autocmd("ColorScheme", {
        group = group,
        pattern = "everforest",
        callback = set_everforest_terminal_colors,
      })
      set_everforest_terminal_colors()
    end,
  },
  {
    "catppuccin/nvim",
    name = "catppuccin",
    opts = {
      flavour = "mocha",
      transparent_background = true,
      custom_highlights = function(colors)
        return {
          LineNr = {
            fg = colors.pink,
          },
        }
      end,
      integrations = {
        cmp = true,
        gitsigns = true,
        nvimtree = true,
        telescope = true,
        notify = true,
        mini = true,
        leap = true,
        dashboard = true,
        markdown = true,
        mason = true,
        noice = true,
        which_key = true,
        illuminate = true,
      },
    },
  },
  { "rose-pine/neovim", name = "rose-pine" },
  { "ellisonleao/gruvbox.nvim" },
  {
    "folke/tokyonight.nvim",
    opts = {
      transparent = false,
      styles = {
        -- sidebars = "transparent",
        -- floats = "transparent",
      },
      on_highlights = function(highlights, _)
        highlights.LineNr = { fg = "#bbbbbb" }
        highlights.ColorColumn = { bg = "#BBBBBF" }
      end,
    },
  },
  -- Configure LazyVim to load gruvbox
  {
    "LazyVim/LazyVim",
    opts = {
      colorscheme = "everforest",
    },
  },
}
