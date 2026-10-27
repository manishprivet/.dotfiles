-- Rex configuration: https://www.superlogical.com/rex/docs/customize/config
-- Validate: rex config check
-- Apply changes: rex config reload (Rex does not watch this file).
-- Keep the client's default shortcuts except where overridden below.
-- Ported from ~/.tmux.conf where Rex exposes a documented equivalent.
-- Client appearance, status bars, mouse handling, terminal capabilities,
-- vi copy mode and TPM/resurrect/continuum are not configured
-- here: the published config API does not document equivalent settings.

-- macOS pane shortcuts.
rex.bind("cmd+d", "pane.split", { direction = "right" })
rex.bind("cmd+shift+d", "pane.split", { direction = "down" })
rex.bind("cmd+shift+enter", "pane.zoom")

-- Ctrl+S prefix, matching ~/.tmux.conf.
-- Press Escape to cancel a sequence; Ctrl+S twice sends Ctrl+S through.
rex.bind("ctrl+s>ctrl+s", "pane.send_key", { key = "ctrl+s" })
rex.bind("ctrl+s>c", "client.tab.new")
rex.bind("ctrl+s>,", "client.tab.rename")
rex.bind("ctrl+s>n", "client.tab.next")
rex.bind("ctrl+s>p", "client.tab.previous")
rex.bind("ctrl+s>shift+\\", "pane.split", { direction = "right" }) -- |
rex.bind("ctrl+s>-", "pane.split", { direction = "down" })
rex.bind("ctrl+s>m", "pane.zoom")
rex.bind("ctrl+s>x", "pane.close")

-- Additional tmux default bindings.
rex.bind("ctrl+s>shift+4", "session.rename") -- $
rex.bind("ctrl+s>s", "session.switch")
-- Toggle Rex's sidebar without taking terminal Ctrl chords.
rex.bind("ctrl+s>b", "client.sidebar.toggle")
rex.bind("ctrl+s>o", "pane.focus_next")
rex.bind("ctrl+s>shift+7", "client.tab.close") -- & (Rex controls confirmation)
rex.bind("ctrl+s>shift+1", "pane.move_to_new_tab") -- !
for _, direction in ipairs({ "left", "down", "up", "right" }) do
    rex.bind("ctrl+s>" .. direction, "pane.focus", { direction = direction })
end

-- tmux bind -r h/j/k/l: resize by five cells while the key is held.
-- Repeat timing for a sequence is controlled by the Rex client; there is
-- no documented equivalent of tmux's post-prefix repeat-key timeout.
for key, direction in pairs({ h = "left", j = "down", k = "up", l = "right" }) do
    local resize_direction = direction
    local action = "resize_" .. direction
    rex.action{
        name = action,
        title = "Resize Pane " .. direction .. " by 5",
        repeats = true,
        run = function()
            rex.client.queue("pane.resize", { direction = resize_direction, amount = 5 })
        end,
    }
    rex.bind("ctrl+s>" .. key, action)
end

for index = 1, 9 do
    rex.bind("ctrl+s>" .. index, "client.tab.goto", { index = index })
end

-- Herdr-style navigation: let Vim handle its splits, otherwise focus Rex panes.
-- Neovim's matching edge handoff lives in plugins/vim-tmux-navigator.lua.
local function is_vim(process)
    if not process then return false end
    local name = (process.name or ""):lower():match("([^/]+)$") or ""
    if name:sub(-4) == "diff" then name = name:sub(1, -5) end
    return name == "vi" or name == "vim" or name == "nvim"
        or name == "view" or name == "gvim" or name == "gview"
        or name == "vimx" or name == "rvim" or name == "rview"
end

for key, direction in pairs({ h = "left", j = "down", k = "up", l = "right" }) do
    local focus_direction = direction
    rex.bind("ctrl+" .. key, function()
        local process = rex.block.call("com.superlogical.terminal", "process", {})
        if process and is_vim(process.foreground) then
            return false -- Send the original Ctrl chord to Vim, not Rex.
        end
        local _, err = rex.session.focus_direction{ direction = focus_direction, wrap = false }
        if err ~= nil then error(err, 0) end
        return true
    end)
end

-- Resize panes with Ctrl+Alt+Arrow.
for _, direction in ipairs({ "left", "down", "up", "right" }) do
    rex.bind("ctrl+alt+" .. direction, "pane.resize", { direction = direction, amount = 5 })
end

-- Restart tab numbering on every config load (including config check).
-- Do not wait for the watcher here: config loading must finish before the
-- server can answer it. The detached launcher waits for startup readiness,
-- then execs rex so takeover signals stop the watcher, not a retrying wrapper.
local home = assert(os.getenv("HOME"), "HOME is not set")
local config_home = os.getenv("XDG_CONFIG_HOME") or (home .. "/.config")
local state_home = os.getenv("XDG_STATE_HOME") or (home .. "/.local/state")
local rex_binary = home .. "/Library/Application Support/com.superlogical.rex/RexServer/Versions/Current/Rex Server.app/Contents/MacOS/rex"
local watcher, watcher_error = rex.exec.start({
    "/bin/sh", "-c", [[
        unset REX_SERVER REX_SESSION REX_BLOCK REX_CLIENT
        mkdir -p "$3" || exit 1
        exec >>"$3/tab-numbers.log" 2>&1
        attempt=0
        until "$1" --autostart=false --timeout 1s server status >/dev/null 2>&1; do
            attempt=$((attempt + 1))
            if [ "$attempt" -ge 30 ]; then
                echo 'tab-numbers: server not ready; reload config to retry'
                exit 1
            fi
            sleep 0.2
        done
        exec "$1" --autostart=false do "$2" --all
    ]],
    "rex-tab-numbers", rex_binary, config_home .. "/rex/tab-numbers.lua", state_home .. "/rex",
}, {
    detach = true,
    stdout = false,
    stderr = false,
    -- Watch the local server, not an inherited terminal/session target.
    env = { REX_SERVER = false, REX_SESSION = false, REX_BLOCK = false, REX_CLIENT = false },
})
if not watcher then
    rex.log("error", "Unable to start tab numbering: " .. tostring(watcher_error))
end
