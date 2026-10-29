-- Config loading must not wait for the server it is configuring.
local home = assert(os.getenv("HOME"), "HOME is not set")
local config = os.getenv("XDG_CONFIG_HOME") or (home .. "/.config")
local state = (os.getenv("XDG_STATE_HOME") or (home .. "/.local/state")) .. "/rex"
local binary = os.getenv("REX_SESSION_PERSISTENCE_BIN")
    or (home .. "/Library/Application Support/com.superlogical.rex/RexServer/Versions/Current/Rex Server.app/Contents/MacOS/rex")
local handle, err = rex.exec.start({
    "/bin/sh", "-c", [[
        unset REX_SERVER REX_SESSION REX_BLOCK REX_CLIENT
        umask 077
        mkdir -p "$3" || exit 1
        exec >>"$3/session-persistence.log" 2>&1
        attempt=0
        until "$1" --autostart=false --timeout 2s server status >/dev/null 2>&1; do
            attempt=$((attempt + 1))
            if [ "$attempt" -ge 120 ]; then
                echo 'session-persistence: server not ready; reload config to retry'
                exit 1
            fi
            sleep 0.5
        done
        # Login shells and filesystem access can be slow immediately after boot.
        # This timeout also covers session.create for the complete saved layout.
        exec "$1" --autostart=false --timeout 120s do "$2" --all
    ]], "rex-session-persistence", binary,
    config .. "/rex/extensions/session-persistence/watcher.lua", state,
}, {
    detach = true, stdout = false, stderr = false,
    env = { REX_SERVER = false, REX_SESSION = false, REX_BLOCK = false, REX_CLIENT = false },
})
if not handle then rex.log("error", "Unable to start session persistence: " .. tostring(err)) end
