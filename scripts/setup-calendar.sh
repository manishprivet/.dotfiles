#!/bin/bash
set -euo pipefail

# The current PyPI release only supports V8 format 15; Notion Calendar uses 16.
# Pin the upstream parser with format 16 support, isolated from user Python packages.
PARSER_REVISION=b65ff9bd6dedb61e7b288e1bdadf68ef6b1f56bb
VENV="$HOME/.local/share/sketchybar/dfindexeddb"

python3 -m venv "$VENV"
CPPFLAGS="-I/opt/homebrew/include ${CPPFLAGS:-}" \
LDFLAGS="-L/opt/homebrew/lib ${LDFLAGS:-}" \
  "$VENV/bin/python" -m pip install \
  "dfindexeddb @ git+https://github.com/google/dfindexeddb.git@$PARSER_REVISION"

"$VENV/bin/python" -c \
  'from dfindexeddb.indexeddb.chromium.v8 import ValueDeserializer; assert ValueDeserializer.LATEST_VERSION >= 16, "V8 format 16 support required"'
