#!/bin/bash
set -euo pipefail

DOTFILES_DIR="$HOME/.dotfiles"
BREWFILE="$DOTFILES_DIR/.Brewfile"
EXCLUDE_FILE="$DOTFILES_DIR/.brewfile-exclude"

# Check if brew is installed
if ! command -v brew &> /dev/null; then
    echo "Error: Homebrew is not installed" >&2
    exit 1
fi

# Export current brew packages directly to dotfiles directory
brew bundle dump --file="$BREWFILE" --force
echo "Brewfile exported to $BREWFILE"

# Filter out excluded keywords if exclude file exists
if [[ -f "$EXCLUDE_FILE" ]]; then
    echo "Filtering out excluded packages..."
    
    # Build grep pattern from exclude file (skip empty lines and comments)
    exclude_pattern=""
    while IFS= read -r keyword || [[ -n "$keyword" ]]; do
        # Skip empty lines and comments
        [[ -z "$keyword" || "$keyword" =~ ^[[:space:]]*# ]] && continue
        
        # Trim whitespace
        keyword=$(echo "$keyword" | xargs)
        
        if [[ -n "$exclude_pattern" ]]; then
            exclude_pattern="$exclude_pattern|$keyword"
        else
            exclude_pattern="$keyword"
        fi
    done < "$EXCLUDE_FILE"
    
    if [[ -n "$exclude_pattern" ]]; then
        # Filter out lines matching any keyword
        grep -Ev "$exclude_pattern" "$BREWFILE" > "${BREWFILE}.tmp" || true
        mv "${BREWFILE}.tmp" "$BREWFILE"
        echo "Filtered out packages matching: $exclude_pattern"
    fi
else
    echo "No exclude file found at $EXCLUDE_FILE (skipping filter step)"
fi

echo "Done!"
