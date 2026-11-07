#!/bin/bash
set -euo pipefail
if ! gh extension list | grep -q 'dlvhdr/gh-dash'; then
  if gh auth status >/dev/null 2>&1; then
    gh extension install dlvhdr/gh-dash
  else
    printf 'gh-dash needs gh auth login; sign in and run chezmoi apply again.\n'
  fi
fi
