#!/usr/bin/env fish

# Install Fisher
curl -sL https://raw.githubusercontent.com/jorgebucaran/fisher/main/functions/fisher.fish | source && fisher install jorgebucaran/fisher

# Virtualfish
if type -q vf
    vf install
end

# NVM
fisher install jorgebucaran/nvm.fish
