# Platform-specific paths; keep Homebrew and Docker Desktop off Linux's PATH.
if test (uname -s) = Darwin
    fish_add_path --append "$HOME/.docker/bin"
    if test -x /opt/homebrew/bin/brew
        /opt/homebrew/bin/brew shellenv | source
    else if test -x /usr/local/bin/brew
        /usr/local/bin/brew shellenv | source
    end
end

# Houses Color Palette (see ~/.config/houses/palette.json)
# Set this to light to select the companion palette and Lazygit theme.
set -g houses_theme_mode dark
set -l foreground d4be98
set -l selection 3c3836
set -l comment 928374
set -l red ea6962
set -l orange e78a4e
set -l yellow d8a657
set -l green a9b665
set -l purple d3869b
set -l cyan 7daea3
set -l pink ea6962

if test "$houses_theme_mode" = light
    set foreground 3c3836
    set selection d8c7ac
    set comment 756757
    set red b5403a
    set orange a04b18
    set yellow 886014
    set green 586c2d
    set purple 984565
    set cyan 326b60
    set pink b5403a
end

# Syntax Highlighting Colors
set -g fish_color_normal $foreground
set -g fish_color_command $cyan
set -g fish_color_keyword $pink
set -g fish_color_quote $yellow
set -g fish_color_redirection $foreground
set -g fish_color_end $orange
set -g fish_color_error $red
set -g fish_color_param $purple
set -g fish_color_comment $comment
set -g fish_color_selection --background=$selection
set -g fish_color_search_match --background=$selection
set -g fish_color_operator $green
set -g fish_color_escape $pink
set -g fish_color_autosuggestion $comment

# Completion Pager Colors
set -g fish_pager_color_progress $comment
set -g fish_pager_color_prefix $cyan
set -g fish_pager_color_completion $foreground
set -g fish_pager_color_description $comment
set -g fish_pager_color_selected_background --background=$selection

set -gx EDITOR nvim

if status is-interactive
    if type -q starship
        starship init fish | source
        if functions -q enable_transience
            enable_transience
        end
    end
    if type -q zoxide
        zoxide init fish | source
    end
end

# bun
# set --export BUN_INSTALL "$HOME/.bun"
# set --export PATH $BUN_INSTALL/bin $PATH

# FZF bindings
if status is-interactive; and functions -q fzf_configure_bindings
    fzf_configure_bindings --directory=\c] --git_log= --git_status=\co --processes=\cp
end

if status is-interactive; and type -q direnv
    direnv hook fish | source
end

abbr --add gitp git push -u origin HEAD

# pnpm
if test (uname -s) = Darwin
    set -gx PNPM_HOME "$HOME/Library/pnpm"
else
    set -gx PNPM_HOME "$HOME/.local/share/pnpm"
end
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH "$PNPM_HOME" $PATH
end
# pnpm end

if test -f "$__fish_config_dir/secrets.fish"
    source "$__fish_config_dir/secrets.fish"
end

# opencode
fish_add_path "$HOME/.opencode/bin"
export PATH="$HOME/.local/bin:$PATH"

# bun
set --export BUN_INSTALL "$HOME/.bun"
set --export PATH $BUN_INSTALL/bin $PATH

set -l houses_lazygit_theme houses
if test "$houses_theme_mode" = light
    set houses_lazygit_theme houses-light
end
set --export LG_CONFIG_FILE "$HOME/.config/lazygit/config.yml,$HOME/.config/lazygit/themes/$houses_lazygit_theme.yml"

# Added by `rbenv init` on Mon Jan 12 09:03:47 JST 2026
if status is-interactive; and type -q rbenv
    rbenv init - --no-rehash fish | source
end

if status is-interactive; and isatty stdin
    set -gx GPG_TTY (tty)
end

# The next line updates PATH for the Google Cloud SDK.
if test -f "$HOME/google-cloud-sdk/path.fish.inc"
    source "$HOME/google-cloud-sdk/path.fish.inc"
end

# Rex CLI outside Rex; Current follows server updates without pinning a version.
set -l rex_bin_dir "$HOME/Library/Application Support/com.superlogical.rex/RexServer/Versions/Current/Rex Server.app/Contents/MacOS"
if test -x "$rex_bin_dir/rex"
    fish_add_path --path --prepend --move "$rex_bin_dir"
end

# Inside Rex, prefer the CLI supplied by the running server.
if set -q REX_BIN_DIR; and test -n "$REX_BIN_DIR"
    fish_add_path --path --prepend --move "$REX_BIN_DIR"
end

# Resolve mise-managed tool versions for this directory and refresh on cd.
if status is-interactive; and type -q mise
    mise activate fish | source
end

# Untracked machine-specific overrides, loaded after the shared configuration.
if test -f "$__fish_config_dir/local.fish"
    source "$__fish_config_dir/local.fish"
end
