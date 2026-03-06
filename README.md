<img width="2560" height="1440" alt="Screenshot 2025-07-14 at 1 16 03" src="https://github.com/user-attachments/assets/642997a8-a49f-4e44-a702-3e21166ed08b" />

# Installation

> This dotfiles is tested only on MacOS

Run

```bash
chmod +x ./scripts/setup.sh
./scripts/setup.sh
```

This script will:

- [ ] Install Homebrew
- [ ] Install all Homebrew packages
- [ ] Install all fish plugins
- [ ] Setup symlinks for configurations

# OpenCode skills

This repo keeps Anthropic skills as a git submodule and only stows selected skills into `~/.config/opencode/skills`.

- Submodule location: `submodules/anthropic-skills`
- Stow ignores `submodules/` via `.stow-local-ignore`, so the full skills tree is never linked to your home directory
- Selected skills are exposed through symlinks in `.config/opencode/skills/`

## Clone with submodules

```bash
git clone --recurse-submodules <your-dotfiles-repo-url>
```

If already cloned:

```bash
git submodule update --init --recursive
```

## Add or update a single skill link

Example (`skill-creator`):

```bash
mkdir -p .config/opencode/skills
ln -sfn "../../../submodules/anthropic-skills/skills/skill-creator" \
  ".config/opencode/skills/skill-creator"
```

Then apply symlinks:

```bash
stow .
```
