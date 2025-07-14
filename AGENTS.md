# Dotfiles Repository Agent Guidelines

## Setup and Installation
- Primary setup script: `./scripts/setup.sh`
- Requires MacOS
- Uses Homebrew, Stow for package and config management
- Requires manual execution: `chmod +x ./scripts/setup.sh && ./scripts/setup.sh`

## Development Commands
- Install dependencies: `brew bundle --file .Brewfile`
- Symlink configs: `stow .`
- Fish plugin management: `./scripts/fish.sh`

## Code Style Guidelines
- Configuration files use native format (`.toml`, `.conf`, `.yml`)
- Shell scripts: Use `shellcheck` for linting
- Bash scripts: 
  - Use `#!/bin/bash` shebang
  - Prefer `[[ ]]` over `[ ]`
  - Quote variables
- Fish shell scripts:
  - Follow fish-specific conventions
  - Use `set` for variable declarations
  - Prefer function definitions over aliases

## Error Handling
- Use `set -e` in bash scripts to exit on errors
- Add error logging and exit codes
- Validate input and dependencies before execution

## Testing
- No formal test suite detected
- Manual testing recommended
- Verify configurations after setup

## Repository Structure
- `scripts/`: Utility and setup scripts
- `.config/`: Application configurations
- Prefer declarative configuration over complex scripts

## Recommended Tools
- ShellCheck for shell script linting
- Stow for dotfile management
- Homebrew for package management

## Notes
- Configurations are personal and may require customization
- Always review scripts before execution