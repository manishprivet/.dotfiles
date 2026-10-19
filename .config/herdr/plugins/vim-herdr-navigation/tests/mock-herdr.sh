#!/usr/bin/env bash
set -euo pipefail

: "${HERDR_NAV_TEST_LOG:?HERDR_NAV_TEST_LOG must name the command log}"
printf '%s\n' "$*" >>"$HERDR_NAV_TEST_LOG"

if [[ ${1:-} == pane && ${2:-} == process-info ]]; then
  printf '{"result":{"process_info":{"foreground_processes":[{"name":"%s"}]}}}\n' \
    "${HERDR_NAV_TEST_PROCESS:-zsh}"
fi
