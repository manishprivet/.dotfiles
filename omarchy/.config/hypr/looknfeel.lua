-- Personal spacing, adapted from .config/aerospace/aerospace.toml.
-- Hyprland applies gaps_in on each adjoining window: 9 + 9 = 18 logical px.
-- Omarchy reserves space for its own bar; do not copy Sketchybar's 57px top gap.
hl.config({
  general = {
    gaps_in = 9,
    gaps_out = { top = 18, right = 18, bottom = 10, left = 18 },
  },
})

-- Leave border colors, border size, rounding, opacity, blur and animations to
-- Omarchy's defaults/theme. macOS JankyBorders pixels are not a direct mapping.
