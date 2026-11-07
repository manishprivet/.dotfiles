"""Real PTY foreground handoff, agent exit, and interactive Fish fallback."""
import errno
import os
from pathlib import Path
import pty
import select
import signal
import sys
import tempfile
import time
import unittest


class LauncherTest(unittest.TestCase):
    @unittest.skipUnless(Path("/opt/homebrew/bin/fish").is_file(), "requires Homebrew Fish")
    def test_foreground_then_shell(self):
        with tempfile.TemporaryDirectory() as root:
            root = Path(root)
            agent = root / "opencode"
            agent.write_text("#!/usr/bin/env python3\nimport os,sys\nprint('AGENT_FOREGROUND='+str(os.tcgetpgrp(0)==os.getpgrp()),flush=True)\nprint('ARGS='+repr(sys.argv[1:]),flush=True)\ninput()\n")
            agent.chmod(0o700)
            launcher = Path(__file__).with_name("launch-agent.py").resolve()
            pid, fd = pty.fork()
            if pid == 0:
                os.environ.update(PATH=str(root) + os.pathsep + os.environ["PATH"],
                                  XDG_CONFIG_HOME=str(root / "config"), TERM="xterm-256color")
                os.execv(sys.executable, [sys.executable, str(launcher), "opencode", "ses_exact"])
            output = b""

            def until(marker):
                nonlocal output
                deadline = time.monotonic() + 15
                while marker not in output and time.monotonic() < deadline:
                    ready, _, _ = select.select([fd], [], [], max(0, deadline - time.monotonic()))
                    if ready:
                        try:
                            chunk = os.read(fd, 65536)
                        except OSError as error:
                            if error.errno == errno.EIO: break
                            raise
                        if not chunk: break
                        output += chunk
                self.assertIn(marker, output, output.decode(errors="replace"))

            try:
                until(b"AGENT_FOREGROUND=True")
                until(b"ARGS=['--session', 'ses_exact']")
                os.write(fd, b"\n")
                # Wait until the supervisor execs Fish before sending shell input.
                deadline = time.monotonic() + 10
                while time.monotonic() < deadline:
                    import subprocess
                    name = subprocess.check_output(["/bin/ps", "-p", str(pid), "-o", "comm="], text=True)
                    if "fish" in name: break
                    select.select([], [], [], 0.05)
                self.assertIn("fish", name)
                self.assertEqual(os.tcgetpgrp(fd), pid)
                os.write(fd, b"echo SHELL_RETURNED; exit\n")
                until(b"SHELL_RETURNED")
            finally:
                try: os.kill(pid, signal.SIGHUP)
                except ProcessLookupError: pass
                os.close(fd)
                os.waitpid(pid, 0)


if __name__ == "__main__":
    unittest.main()
