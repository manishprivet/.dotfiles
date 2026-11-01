#!/bin/sh
# Start only: never stops a live server or interrupts agents.
set -eu
binary=${REX_SESSION_PERSISTENCE_BIN:-"$HOME/Library/Application Support/com.superlogical.rex/RexServer/Versions/Current/Rex Server.app/Contents/MacOS/rex"}
if "$binary" --autostart=false server status >/dev/null 2>&1; then
    echo 'A Rex server is already running. Leave it running until your custom snapshot is verified.' >&2
    exit 1
fi
exec "$binary" server start --restore=false "$@"
