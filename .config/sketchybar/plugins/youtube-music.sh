#!/bin/bash

# Only the presentation adapter is platform-specific; the API client is shared.
CONFIG_HOME=${XDG_CONFIG_HOME:-"$HOME/.config"}
if command -v node >/dev/null 2>&1; then
  exec node "$CONFIG_HOME/youtube-music/sketchybar.mjs"
fi
exec /opt/homebrew/bin/mise exec node -- node "$CONFIG_HOME/youtube-music/sketchybar.mjs"
