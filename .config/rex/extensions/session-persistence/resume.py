"""Publish startup readiness and consume an exact, one-shot watcher request."""
import fcntl
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time


def identity(pid):
    result = subprocess.run(["/bin/ps", "-p", str(pid), "-o", "lstart="],
                            text=True, capture_output=True)
    return result.stdout if result.returncode == 0 else None


def command(record):
    agent, sid, cwd = (record.get(key) for key in ("agent", "session_id", "cwd"))
    pattern = r"[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}" if agent == "claude" else r"ses_[A-Za-z0-9_-]+"
    if agent not in ("claude", "opencode") or not isinstance(sid, str) or len(sid) > 128 or not re.fullmatch(pattern, sid):
        return None
    if not isinstance(cwd, str) or not Path(cwd).is_absolute() or not Path(cwd).is_dir():
        return None
    executable = shutil.which(agent)
    return [executable, "--resume" if agent == "claude" else "--session", sid] if executable else None


def eligible(record, server, session):
    return (record.get("rex_session") == session
            and isinstance(record.get("instance_id"), str)
            and record["instance_id"] != server["instance_id"]
            and isinstance(record.get("pid"), int) and record["pid"] > 1
            and isinstance(record.get("identity"), str)
            and identity(record["pid"]) != record["identity"])


def main():
    if "REX_AGENT_RESUME_DISABLE" in os.environ:
        return
    block, session = os.getenv("REX_BLOCK", ""), os.getenv("REX_SESSION", "")
    scope = os.getenv("REX_SESSION_PERSISTENCE_SCOPE", "local")
    if not all(re.fullmatch(r"[\w:-]+", value) for value in (block, session, scope)):
        return
    shell = int(sys.argv[1])
    mode = sys.argv[2] if len(sys.argv) > 2 else "ready"
    if mode not in ("ready", "consume"):
        return
    if shell != os.getppid() or not sys.stdin.isatty():
        return
    env = {k: v for k, v in os.environ.items() if k not in ("REX_SERVER", "REX_CLIENT")}
    rex = shutil.which("rex")
    if not rex:
        return

    def query(*args, with_pid=False):
        with subprocess.Popen([rex, "--autostart=false", "--timeout", "5s", *args], env=env,
                              text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL) as child:
            try:
                output, _ = child.communicate(timeout=8)
            except subprocess.TimeoutExpired:
                child.kill()
                child.communicate()
                raise
            if child.returncode:
                raise RuntimeError("Rex metadata query failed")
            result = json.loads(output)
            return (result, child.pid) if with_pid else result

    server = query("server", "status", "--json")
    host = server["host_id"]
    if not re.fullmatch(r"[\w-]+", host):
        return
    root = Path(os.getenv("XDG_STATE_HOME", str(Path.home() / ".local/state"))) / "rex/session-persistence" / (host + "-" + scope)
    state = json.loads((root / "agents.json").read_text())
    if state.get("version") != 1 or state.get("host_id") != host:
        return
    record = state.get("agents", {}).get(block)
    if not record or not eligible(record, server, session):
        return
    argv = command(record)
    if not argv:
        return
    # Only the top-level restored shell may launch. A nested shell or another
    # foreground program fails closed, even if it inherited the same pane IDs.
    process, query_pid = query("block", "call", "-s", session, "-b", block, "process", with_pid=True)
    chain = [process.get("foreground") or {}, *(process.get("ancestors") or [])]
    if process.get("last_exit") is not None or not any(p.get("pid") == shell and p.get("name") == "fish" for p in chain):
        return
    if any(p.get("pid") not in (os.getpid(), shell, query_pid) and p.get("name") != "login" for p in chain):
        return
    if (process.get("foreground") or {}).get("pid") not in (os.getpid(), shell, query_pid):
        return
    readiness = root / "readiness"
    readiness.mkdir(mode=0o700, exist_ok=True)
    shell_identity = identity(shell)
    if not shell_identity:
        return
    if mode == "ready":
        marker = dict(instance_id=server["instance_id"], rex_session=session,
                      shell_pid=shell, shell_identity=shell_identity, expires=time.time() + 120)
        path = readiness / (block + ".ready.json")
        temporary = path.with_suffix(".tmp")
        fd = os.open(temporary, os.O_CREAT | os.O_TRUNC | os.O_WRONLY, 0o600)
        with os.fdopen(fd, "w") as stream:
            json.dump(marker, stream)
        os.replace(temporary, path)
        return
    request = json.loads((readiness / (block + ".request.json")).read_text())
    if (request.get("instance_id") != server["instance_id"] or request.get("rex_session") != session
            or request.get("shell_pid") != shell or request.get("shell_identity") != shell_identity
            or not isinstance(request.get("expires"), (int, float))
            or not time.time() <= request["expires"] <= time.time() + 120):
        return
    claims = root / "claims"
    claims.mkdir(mode=0o700, exist_ok=True)
    # Keep a separate lock inode; the claim JSON is atomically replaced.
    fd = os.open(claims / (block + ".lock"), os.O_CREAT | os.O_RDWR, 0o600)
    with os.fdopen(fd, "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        path = claims / (block + ".json")
        if path.exists() and json.loads(path.read_text()).get("instance_id") == server["instance_id"]:
            return
        temporary = path.with_suffix(".tmp")
        fd = os.open(temporary, os.O_CREAT | os.O_TRUNC | os.O_WRONLY, 0o600)
        with os.fdopen(fd, "w") as stream:
            json.dump({"instance_id": server["instance_id"], "helper_pid": os.getpid(),
                       "helper_identity": identity(os.getpid()), "shell_pid": shell}, stream)
        os.replace(temporary, path)  # Consume before launch; never blindly retry.
        # The key binding builds an escaped normal foreground command, not exec.
        sys.stdout.write("\0".join([record["cwd"], *argv]) + "\0")
        sys.stdout.flush()


if __name__ == "__main__":
    try:
        main()
    except FileNotFoundError:
        pass  # No recorded conversation, or no longer available.
    except Exception as error:
        print("Rex agent resume skipped: " + str(error), file=sys.stderr)
