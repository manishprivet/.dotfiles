#!/usr/bin/env bash

# make sure it's executable with:
# chmod +x ~/.config/sketchybar/plugins/aerospace.sh
source "$CONFIG_DIR/colors.sh"

if [ "$1" = "$FOCUSED_WORKSPACE" ]; then
  sketchybar --set "$NAME" --animate tanh 30 background.drawing=on \
    background.color="$ACCENT_COLOR" \
    label.color="$BACKGROUND" \
    icon.color="$BACKGROUND"
else
  sketchybar --set "$NAME" --animate tanh 30 background.drawing=off \
    label.color="$ACCENT_COLOR" \
    icon.color="$ACCENT_COLOR"
fi
