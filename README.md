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
