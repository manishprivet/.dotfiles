#!/bin/bash
set -euo pipefail
if tmux list-sessions >/dev/null 2>&1; then tmux source-file "$HOME/.tmux.conf"; fi
