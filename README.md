<img width="2560" height="1440" alt="macOS setup" src="https://github.com/user-attachments/assets/642997a8-a49f-4e44-a702-3e21166ed08b" />

# Dotfiles

Personal macOS and Omarchy dotfiles, managed with [chezmoi](https://www.chezmoi.io/).

Install chezmoi with `brew install chezmoi` or `omarchy pkg add chezmoi`, then:

```bash
chezmoi init manishprivet/.dotfiles
chezmoi diff
chezmoi apply
```

Applying installs packages and runs setup hooks.

Package inventory lives in `home/.chezmoidata/packages.yaml`. The macOS hook
renders Homebrew Bundle declarations for taps, formulae and npm tools, preserving
tap URLs, trust settings and formula options. Casks and Mac App Store apps are
installed separately; app configuration is still managed here. The old `.Brewfile`
and export script are retired. Package changes can trigger installs or upgrades
on the next apply; no cleanup or automatic uninstallation is performed.

Use `chezmoi apply --dry-run --verbose` to preview, or
`chezmoi apply --exclude=scripts,externals` for config-only changes.
