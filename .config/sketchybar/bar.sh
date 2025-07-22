#!/bin/bash

bar=(
  position=top
  height=37
  margin=16
  y_offset=10
  corner_radius="$CORNER_RADIUS"
  border_color="$ACCENT_COLOR"
  border_width=2
  blur_radius=30
  color="$BAR_COLOR"
)

sketchybar --bar "${bar[@]}"
