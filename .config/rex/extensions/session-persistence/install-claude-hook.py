"""Idempotently merge Rex hooks into local Claude settings, preserving user data."""
import json
import os
from pathlib import Path
import shlex
import shutil
import tempfile
import time

home = Path.home()
settings = Path(os.getenv("CLAUDE_CONFIG_DIR", str(home / ".claude"))) / "settings.json"
hook = Path(os.getenv("XDG_CONFIG_HOME", str(home / ".config"))) / "rex/extensions/session-persistence/claude-hook.py"
command = "python3 " + shlex.quote(str(hook))
data = json.loads(settings.read_text()) if settings.exists() else {}
changed = False
for event in ("SessionStart", "UserPromptSubmit", "SessionEnd"):
    groups = data.setdefault("hooks", {}).setdefault(event, [])
    if not any(h.get("command") == command for group in groups for h in group.get("hooks", [])):
        groups.append({"hooks": [{"type": "command", "command": command, "timeout": 5}]})
        changed = True
if changed:
    settings.parent.mkdir(parents=True, exist_ok=True)
    if settings.exists():
        shutil.copy2(settings, settings.with_name("settings.json.rex-backup-" + str(time.time_ns())))
    fd, temporary = tempfile.mkstemp(dir=settings.parent, prefix=".rex-settings-")
    with os.fdopen(fd, "w") as stream:
        json.dump(data, stream, indent=2)
        stream.write("\n")
    os.replace(temporary, settings)
print("Claude Rex hooks " + ("installed" if changed else "already installed"))
