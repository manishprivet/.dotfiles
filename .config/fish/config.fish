if status is-interactive
    # Commands to run in interactive sessions can go here
end
eval "$(/opt/homebrew/bin/brew shellenv)"

# TokyoNight Color Palette
set -l foreground c0caf5
set -l selection 33467c
set -l comment 565f89
set -l red f7768e
set -l orange ff9e64
set -l yellow e0af68
set -l green 9ece6a
set -l purple 9d7cd8
set -l cyan 7dcfff
set -l pink bb9af7

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

starship init fish | source
enable_transience

zoxide init fish | source

# bun
# set --export BUN_INSTALL "$HOME/.bun"
# set --export PATH $BUN_INSTALL/bin $PATH

# FZF bindings
fzf_configure_bindings --directory=\c] --git_log= --git_status=\co --processes=\cp

eval "$(direnv hook fish)"

alias tailscale /Applications/Tailscale.app/Contents/MacOS/Tailscale

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

# The next line updates PATH for the Google Cloud SDK.
if [ -f '/Users/manishprivet/google-cloud-sdk/path.fish.inc' ]; . '/Users/manishprivet/google-cloud-sdk/path.fish.inc'; end
export PATH="$HOME/.local/bin:$PATH"
