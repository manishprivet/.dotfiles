# Startup-only readiness handshake. No polling, agent subprocess, or exec here.
if status is-interactive; and set -q REX_BLOCK REX_SESSION
    function __rex_agent_resume_request
        if set -q REX_AGENT_RESUME_DISABLE
            return
        end
        # Never overwrite user input, including a partially typed command.
        if test -n "$(commandline --current-buffer)"
            return
        end
        set -l config "$HOME/.config"
        if set -q XDG_CONFIG_HOME
            set config "$XDG_CONFIG_HOME"
        end
        set -l launch (command python3 "$config/rex/extensions/session-persistence/resume.py" $fish_pid consume </dev/tty | string split0)
        if test (count $launch) -eq 4
            set -l escaped (string escape -- $launch)
            commandline --replace -- "cd -- $escaped[1]; and command $escaped[2] $escaped[3] $escaped[4]"
            commandline --function execute
        end
    end

    function __rex_agent_resume_ready --on-event fish_prompt
        functions --erase __rex_agent_resume_ready
        if set -q REX_AGENT_RESUME_DISABLE
            return
        end
        # Private wake-up sequence only. The watcher never types a command.
        bind ctrl-alt-shift-f12 __rex_agent_resume_request; or return
        bind --mode insert ctrl-alt-shift-f12 __rex_agent_resume_request; or return
        set -l config "$HOME/.config"
        if set -q XDG_CONFIG_HOME
            set config "$XDG_CONFIG_HOME"
        end
        command python3 "$config/rex/extensions/session-persistence/resume.py" $fish_pid ready </dev/tty
    end
end
