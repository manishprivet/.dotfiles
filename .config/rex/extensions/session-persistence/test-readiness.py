"""PTY regression: normal foreground job, shell return, user input untouched."""
import os
from pathlib import Path
import pty
import select
import signal
import sys
import tempfile
import time
import unittest


class ReadinessTest(unittest.TestCase):
    @unittest.skipUnless(Path("/opt/homebrew/bin/fish").is_file(), "requires Homebrew Fish")
    def test_foreground_shell_return_and_typed_input(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            conf = root / "fish/conf.d"
            conf.mkdir(parents=True)
            (root / "fish/config.fish").write_text("function fish_prompt; printf 'TEST_PROMPT> '; end\n")
            (conf / "resume.fish").write_text(Path(".config/fish/conf.d/rex-agent-resume.fish").read_text())
            helper = root / "rex/extensions/session-persistence/resume.py"
            helper.parent.mkdir(parents=True)
            agent = root / "agent.py"
            agent.write_text("import os\nprint('AGENT_PID='+str(os.getpid()),flush=True)\nprint('FOREGROUND='+str(os.getpgrp()==os.tcgetpgrp(0)),flush=True)\ninput()\n")
            helper.write_text("import sys\nif sys.argv[2]=='ready': print('READY',flush=True)\nelse: sys.stdout.write('\\0'.join(" + repr([str(root), sys.executable, str(agent), "ses_exact"]) + ")+ '\\0')\n")
            pid, fd = pty.fork()
            if pid == 0:
                os.environ.update(XDG_CONFIG_HOME=str(root), REX_BLOCK="b", REX_SESSION="s", TERM="dumb")
                os.environ.pop("REX_AGENT_RESUME_DISABLE", None)
                os.execv("/opt/homebrew/bin/fish", ["fish", "--interactive"])
            output = b""

            def until(marker):
                nonlocal output
                deadline = time.monotonic() + 15
                while marker not in output and time.monotonic() < deadline:
                    if select.select([fd], [], [], max(0, deadline - time.monotonic()))[0]:
                        output += os.read(fd, 65536)
                self.assertIn(marker, output, output.decode(errors="replace"))

            try:
                until(b"READY")
                # A wakeup with user text present must not consume/replace it.
                os.write(fd, b"echo USER_TEXT\x1b[24;8~\n")
                until(b"USER_TEXT\r\n")
                self.assertNotIn(b"AGENT_PID=", output)
                output = b""
                until(b"TEST_PROMPT> ")
                os.write(fd, b"\x1b[24;8~")
                until(b"FOREGROUND=True")
                self.assertNotIn(("AGENT_PID=" + str(pid) + "\r\n").encode(), output)
                self.assertNotEqual(os.tcgetpgrp(fd), pid)
                os.write(fd, b"\n")
                output = b""
                until(b"TEST_PROMPT> ")
                # Send input only after Fish has reclaimed the terminal.
                os.write(fd, b"echo SHELL_RETURNED\n")
                until(b"SHELL_RETURNED\r\n")
                self.assertEqual(os.tcgetpgrp(fd), pid)
            finally:
                try: os.kill(pid, signal.SIGHUP)
                except ProcessLookupError: pass
                os.close(fd)
                os.waitpid(pid, 0)


if __name__ == "__main__":
    unittest.main()
