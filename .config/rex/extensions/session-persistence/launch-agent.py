"""Own the PTY, foreground an exact agent, then replace the supervisor with Fish."""
import os
import re
import signal
import sys
import termios


def launch(agent, sid):
    pattern = r"[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}" if agent == "claude" else r"ses_[A-Za-z0-9_-]+"
    if agent not in ("claude", "opencode") or len(sid) > 128 or not re.fullmatch(pattern, sid):
        raise ValueError("Invalid agent conversation")
    tty = sys.stdin.fileno()
    if not os.isatty(tty):
        raise RuntimeError("Agent launcher requires a terminal")
    original = termios.tcgetattr(tty)
    group = os.getpgrp()
    signal.signal(signal.SIGTTOU, signal.SIG_IGN)
    read_fd, write_fd = os.pipe()
    pid = os.fork()
    if pid == 0:
        try:
            os.close(write_fd)
            os.setpgid(0, 0)
            os.read(read_fd, 1)  # Do not read the terminal before foreground handoff.
            os.close(read_fd)
            for sig in (signal.SIGTTOU, signal.SIGTTIN, signal.SIGTSTP, signal.SIGINT, signal.SIGQUIT):
                signal.signal(sig, signal.SIG_DFL)
            os.execvp(agent, [agent, "--resume" if agent == "claude" else "--session", sid])
        except BaseException as error:
            os.write(2, ("Rex agent launch failed: " + str(error) + "\n").encode())
            os._exit(127)
    os.close(read_fd)
    try:
        os.setpgid(pid, pid)
        os.tcsetpgrp(tty, pid)
        os.write(write_fd, b"1")
    finally:
        os.close(write_fd)
    try:
        while True:
            _, status = os.waitpid(pid, os.WUNTRACED)
            if not os.WIFSTOPPED(status):
                break
            # There is no interactive parent shell to own suspended jobs yet.
            # Resume rather than leave an inaccessible stopped agent behind.
            os.write(2, b"\r\nRex: suspension is unavailable until the agent exits; use its exit command.\r\n")
            os.killpg(pid, signal.SIGCONT)
    finally:
        os.tcsetpgrp(tty, group)
        termios.tcsetattr(tty, termios.TCSANOW, original)


def main():
    try:
        launch(*sys.argv[1:])
    except Exception as error:
        print("Rex agent launch failed: " + str(error), file=sys.stderr)
    # This is a new normal interactive shell, not a first-prompt resume hook.
    os.execv("/opt/homebrew/bin/fish", ["fish", "--login", "--interactive"])


if __name__ == "__main__":
    main()
