local wezterm = require("wezterm")

local config = wezterm.config_builder()

config = {
	font = wezterm.font({
		family = "JetBrainsMono Nerd Font",
		weight = "DemiBold",
	}),

	font_size = 16,

	enable_tab_bar = false,

	window_decorations = "RESIZE",
	custom_block_glyphs = true,
	anti_alias_custom_block_glyphs = true,

	colors = {
		foreground = "#D3C6AA",
		background = "#272E33",
		cursor_bg = "#D3C6AA",
		cursor_fg = "#272E33",
		cursor_border = "#D3C6AA",
		selection_fg = "#D3C6AA",
		selection_bg = "#384B55",
		scrollbar_thumb = "#414B50",
		split = "#414B50",
		ansi = {
			"#272E33",
			"#E67E80",
			"#A7C080",
			"#DBBC7F",
			"#7FBBB3",
			"#D699B6",
			"#83C092",
			"#D3C6AA",
		},
		brights = {
			"#859289",
			"#E67E80",
			"#A7C080",
			"#DBBC7F",
			"#7FBBB3",
			"#D699B6",
			"#83C092",
			"#D3C6AA",
		},
	},

	window_background_opacity = 1,
	-- macos_window_background_blur = 10,

	default_cursor_style = "BlinkingBar",

  background = {
    {
      source = {
        File = wezterm.home_dir .. "/.dotfiles/wallpapers/8.jpg"
      },
      width = "100%",
      height = "100%",
    },
    {
      source = {
			Color = "#1E2326"
		},
      width = "100%",
      height = "100%",
      opacity = 0.75,
    }
  }
}

return config
