# The following lines were added by Docker Desktop to add commands to your PATH.
export PATH="$PATH:/Users/manishprivet/.docker/bin"
# End of Docker Desktop section.

if status is-interactive
    # Commands to run in interactive sessions can go here
end
eval "$(/opt/homebrew/bin/brew shellenv)"

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

starship init fish | source
enable_transience

zoxide init fish | source

# bun
# set --export BUN_INSTALL "$HOME/.bun"
# set --export PATH $BUN_INSTALL/bin $PATH

# FZF bindings
fzf_configure_bindings --directory=\c] --git_log= --git_status=\co --processes=\cp

eval "$(direnv hook fish)"

abbr --add gitp git push -u origin HEAD

# pnpm
set -gx PNPM_HOME "/Users/manishprivet/Library/pnpm"
if not string match -q -- $PNPM_HOME $PATH
  set -gx PATH "$PNPM_HOME" $PATH
end
# pnpm end

if [ -f '/Users/manishprivet/.config/fish/secrets.fish' ]; source /Users/manishprivet/.config/fish/secrets.fish; end

# opencode
fish_add_path /Users/manishprivet/.opencode/bin
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
status --is-interactive; and rbenv init - --no-rehash fish | source

set -gx GPG_TTY (tty)

# The next line updates PATH for the Google Cloud SDK.
if [ -f '/Users/manishprivet/google-cloud-sdk/path.fish.inc' ]; . '/Users/manishprivet/google-cloud-sdk/path.fish.inc'; end

# Rex CLI outside Rex; Current follows server updates without pinning a version.
set -l rex_bin_dir "$HOME/Library/Application Support/com.superlogical.rex/RexServer/Versions/Current/Rex Server.app/Contents/MacOS"
if test -x "$rex_bin_dir/rex"
    fish_add_path --path --prepend --move "$rex_bin_dir"
end

# Inside Rex, prefer the CLI supplied by the running server.
if set -q REX_BIN_DIR; and test -n "$REX_BIN_DIR"
    fish_add_path --path --prepend --move "$REX_BIN_DIR"
end
