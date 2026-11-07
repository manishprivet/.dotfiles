#!/bin/bash
set -euo pipefail

# Both desktop bars use this pinned external decoder; no custom Python parser is maintained.
PARSER_REVISION=b65ff9bd6dedb61e7b288e1bdadf68ef6b1f56bb
VENV="${XDG_DATA_HOME:-$HOME/.local/share}/notion-calendar/dfindexeddb"
STAMP="$VENV/.dotfiles-revision"

if [[ -x $VENV/bin/dfindexeddb && -f $STAMP && $(cat "$STAMP") == "$PARSER_REVISION" ]] &&
  "$VENV/bin/dfindexeddb" --help >/dev/null 2>&1; then
  exit 0
fi

python3 -m venv "$VENV"
if [[ $(uname -s) == Darwin && -d /opt/homebrew/include ]]; then
  export CPPFLAGS="-I/opt/homebrew/include ${CPPFLAGS:-}"
  export LDFLAGS="-L/opt/homebrew/lib ${LDFLAGS:-}"
fi
"$VENV/bin/python" -m pip install \
  "dfindexeddb @ git+https://github.com/google/dfindexeddb.git@$PARSER_REVISION"

"$VENV/bin/python" -c \
  'from dfindexeddb.indexeddb.chromium.v8 import ValueDeserializer; assert ValueDeserializer.LATEST_VERSION >= 16, "V8 format 16 support required"'
printf '%s\n' "$PARSER_REVISION" > "$STAMP"
