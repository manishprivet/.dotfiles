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

This repo stores managed OpenCode skills in `.agents/skills/`.

- `stow .` links them into `~/.agents/skills/`
- edit the checked-in files in `.agents/skills/`, not the linked paths in `~/.agents/skills/`

# OpenCode plugins

This repo vendors selected OpenCode plugins under `.config/opencode/plugin/` instead of installing them from npm at runtime.

- `opencode-tree` is based on `ishaksebsib/opencode-tree`
- Upstream repository: `https://github.com/ishaksebsib/opencode-tree`
- Original author: Ishak Sebsib
