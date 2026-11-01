"""Hermetic CLI/shell-start tests: no Rex server or agent is launched."""
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("resume", Path(__file__).with_name("resume.py"))
resume = importlib.util.module_from_spec(spec)
spec.loader.exec_module(resume)


class ResumeTests(unittest.TestCase):
    def test_exact_commands(self):
        with tempfile.TemporaryDirectory() as cwd, patch.object(resume.shutil, "which", side_effect=lambda x: "/bin/" + x):
            for agent, sid, flag in [("opencode", "ses_exact", "--session"),
                                     ("claude", "550e8400-e29b-41d4-a716-446655440000", "--resume")]:
                record = dict(agent=agent, session_id=sid, cwd=cwd)
                self.assertEqual(resume.command(record), ["/bin/" + agent, flag, sid])
                record["session_id"] += ";echo unsafe"
                self.assertIsNone(resume.command(record))

    def test_startup_and_idempotency(self):
        with tempfile.TemporaryDirectory() as root:
            env = dict(XDG_STATE_HOME=root, REX_SESSION="s", REX_BLOCK="b")
            state = Path(root) / "rex/session-persistence/host-local"
            state.mkdir(parents=True)
            record = dict(agent="opencode", session_id="ses_exact", cwd=root,
                          rex_session="s", instance_id="old", pid=42, identity="old-start")
            (state / "agents.json").write_text(json.dumps(dict(version=1, host_id="host", agents={"b": record})))
            process = dict(foreground=dict(pid=77, name="rex"), last_exit=None,
                           ancestors=[dict(pid=os.getpid(), name="python3"), dict(pid=100, name="fish"), dict(pid=99, name="login")])
            server = dict(instance_id="new", host_id="host")

            class FakeProcess:
                pid = 77
                returncode = 0
                def __init__(self, argv, **kwargs):
                    self.value = process if "process" in argv else server
                def __enter__(self): return self
                def __exit__(self, *args): pass
                def communicate(self, **kwargs): return json.dumps(self.value), None

            with patch.dict(os.environ, env, clear=True), patch.object(resume.sys, "argv", ["resume.py", "100"]), \
                 patch.object(resume.os, "getppid", return_value=100), \
                 patch.object(resume.sys, "stdin", new=io.StringIO()), \
                 patch.object(resume.sys, "stdout", new=io.StringIO()) as output, \
                 patch.object(resume.shutil, "which", side_effect=lambda x: "/bin/" + x), \
                  patch.object(resume, "identity", side_effect=lambda pid: "shell-start" if pid == 100 else None), \
                 patch.object(resume.subprocess, "Popen", FakeProcess), \
                 patch.object(resume.subprocess, "run") as launch:
                with patch.object(resume.sys.stdin, "isatty", return_value=True), patch.object(output, "isatty", return_value=True):
                    # Publish readiness, then require watcher acknowledgement.
                    resume.main()
                    ready = state / "readiness/b.ready.json"
                    request = state / "readiness/b.request.json"
                    self.assertTrue(ready.exists())
                    self.assertEqual(output.getvalue(), "")
                    request.write_text(ready.read_text())
                    resume.sys.argv.append("consume")
                    valid = json.loads(request.read_text())
                    for key, value in [("instance_id", "other"), ("rex_session", "other"),
                                       ("shell_pid", 101), ("shell_identity", "stale"),
                                       ("expires", 0), ("expires", "invalid")]:
                        request.write_text(json.dumps({**valid, key: value}))
                        resume.main()
                        self.assertEqual(output.getvalue(), "")
                        self.assertFalse((state / "claims/b.json").exists())
                    request.write_text(json.dumps(valid))
                    # Busy/nested shell is never touched.
                    process["ancestors"].append(dict(pid=200, name="nvim"))
                    resume.main()
                    launch.assert_not_called()
                    process["ancestors"].pop()
                    resume.main()
                    resume.main()
                    launch.assert_not_called()
                    self.assertEqual(output.getvalue(), root + "\0/bin/opencode\0--session\0ses_exact\0")
                    self.assertEqual((state / "claims/b.json").stat().st_mode & 0o777, 0o600)

    def test_same_instance_and_live_pid(self):
        record = dict(rex_session="s", instance_id="old", pid=42, identity="start")
        with patch.object(resume, "identity", return_value="start"):
            self.assertFalse(resume.eligible(record, dict(instance_id="new"), "s"))
        with patch.object(resume, "identity", return_value=None):
            self.assertFalse(resume.eligible(record, dict(instance_id="old"), "s"))
            self.assertFalse(resume.eligible(record, dict(instance_id="new"), "other"))
            self.assertTrue(resume.eligible(record, dict(instance_id="new"), "s"))


if __name__ == "__main__":
    unittest.main()
