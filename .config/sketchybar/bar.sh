#!/bin/bash

bar=(
  position=top
  height=37
  margin=12
  y_offset=10
  corner_radius=16
  blur_radius=30
  color="$BAR_COLOR"
)

sketchybar --bar "${bar[@]}"
