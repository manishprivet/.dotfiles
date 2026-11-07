#!/usr/bin/env bash
# Optional compatibility entry point; all behavior is owned by chezmoi.
set -e
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
exec chezmoi init --source "$root" --apply "$@"
