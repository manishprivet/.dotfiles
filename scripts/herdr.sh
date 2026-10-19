#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_DIR="${HERDR_INSTALL_DIR:-$HOME/.local/bin}"

# Install Herdr, then register the navigation plugin from this checkout.
curl -fsSL https://herdr.dev/install.sh | sh
"$INSTALL_DIR/herdr" plugin link "$REPO_ROOT/.config/herdr/plugins/vim-herdr-navigation" --enabled
