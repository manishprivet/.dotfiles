# Dotfiles Repository Agent Guidelines

## Development Commands
- Setup: `./scripts/setup.sh`
- Install dependencies: `brew bundle --file .Brewfile`
- Symlink configs: `stow .`
- Fish plugin management: `./scripts/fish.sh`

## Code Style & Conventions
### Shell Scripts
- Use `#!/bin/bash` for bash, `#!/usr/bin/env fish` for fish
- Linting: Always run `shellcheck` before committing
- Bash conventions:
  - Use `[[ ]]` for conditionals
  - Quote all variables: `"$variable"`
  - Use `set -euo pipefail` for robust error handling
- Fish conventions:
  - Use `set` for variable declaration
  - Prefer functions over aliases
  - Use type annotations where possible

## Error Handling
- Always include error logging
- Use exit codes (0 for success, non-zero for errors)
- Validate inputs and dependencies
- Provide clear error messages

## Testing & Verification
- Manual testing recommended
- Verify configuration changes manually
- Use `stow --adopt` for careful config management

## Best Practices
- Keep configurations declarative
- Minimize complex scripting
- Prioritize readability and maintainability
- Personal configs may require customization

## Recommended Tools
- ShellCheck for script linting
- Stow for config management
- Homebrew for package installation