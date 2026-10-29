"""Claude lifecycle hook: record IDs only, never prompts or transcripts."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile


def main():
    block, session = os.getenv("REX_BLOCK", ""), os.getenv("REX_SESSION", "")
    if not all(re.fullmatch(r"[\w:-]+", x) for x in (block, session)):
        return
    event = json.load(sys.stdin)
    if event.get("agent_id"):  # Never attribute nested subagents to the pane.
        return
    sid = event.get("session_id", "")
    if not re.fullmatch(r"[0-9a-fA-F-]{36}", sid):
        return
    root = Path(os.getenv("XDG_STATE_HOME", str(Path.home() / ".local/state"))) / "rex/agent-sessions"
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    path = root / (block + ".json")
    if event.get("hook_event_name") == "SessionEnd":
        if path.exists() and json.loads(path.read_text()).get("session_id") == sid:
            path.unlink()
        return
    # Hook shells may sit between this script and Claude. Find the owning
    # process instead of assuming a fixed number of parent hops.
    pid = os.getppid()
    for _ in range(20):
        line = subprocess.check_output(["/bin/ps", "-p", str(pid), "-o", "ppid=,comm="], text=True).strip()
        parent, name = line.split(None, 1)
        if Path(name).name.lower() in ("claude", "claude-code"):
            break
        pid = int(parent)
        if pid <= 1:
            return
    else:
        return
    identity = subprocess.check_output(["/bin/ps", "-p", str(pid), "-o", "lstart="], text=True)
    record = dict(agent="claude", session_id=sid, cwd=event["cwd"],
                  rex_session=session, pid=pid, identity=identity)
    fd, temporary = tempfile.mkstemp(dir=root, prefix=".claude-")
    try:
        with os.fdopen(fd, "w") as stream:
            json.dump(record, stream)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("rex session capture: " + str(error), file=sys.stderr)
        # Observational hook: never block Claude or return model instructions.
