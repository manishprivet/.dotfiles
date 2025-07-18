-- vim.g.material_style = "deep ocean"
-- vim.g.material_style = "oceanic"
vim.g.material_style = "palenight"
-- vim.g.material_style = "lighter"
-- vim.g.material_style = "darker"

return {
  { "ellisonleao/gruvbox.nvim", priority = 1000, config = true, opts = {
    transparent_mode = true
  } },
  { "EdenEast/nightfox.nvim" },
  { "marko-cerovac/material.nvim" },
  {
    "catppuccin/nvim",
    name = "catppuccin",
    opts = {
      flavour = "mocha",
      transparent_background = true,
      custom_highlights = function (colors)
        return {
          LineNr = {
            fg = colors.pink
          }
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
      colorscheme = "tokyonight-night",
    },
  },
}
