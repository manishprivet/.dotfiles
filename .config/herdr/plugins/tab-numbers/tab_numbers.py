"""Number Herdr tab labels using one-shot, serialized event hooks."""

import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time


class Herdr:
    def __init__(self):
        self.binary = os.environ.get("HERDR_BIN_PATH", "herdr")

    def call(self, *args):
        process = subprocess.run(
            [self.binary, *args], capture_output=True, text=True, timeout=10
        )
        if process.returncode:
            raise RuntimeError(process.stderr.strip() or "Herdr command failed")
        response = json.loads(process.stdout)
        return response["result"]

    def tabs(self):
        # Without --workspace, tab list includes every Space in this session.
        return self.call("tab", "list")["tabs"]

    def rename(self, tab_id, label):
        self.call("tab", "rename", tab_id, label)


def save_state(path, state):
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(state, ensure_ascii=False) + "\n")
    temporary.replace(path)


def reconcile(api, state, mode, save):
    """Keep owned prefixes separate from literal user-authored title text."""
    if mode == "refresh":
        state["enabled"] = True
    elif mode == "remove":
        state["enabled"] = False
    save(state)
    if mode != "remove" and not state.get("enabled", True):
        return

    tabs = api.tabs()
    records = state.setdefault("tabs", {})
    live_ids = {tab["tab_id"] for tab in tabs}
    for tab_id in list(records):
        if tab_id not in live_ids:
            del records[tab_id]
    save(state)

    positions = {}
    for tab in tabs:
        tab_id, label = tab["tab_id"], tab["label"]
        # Herdr's number is a stable identifier, not the current shortcut index.
        # Count list order separately per Space so closes/moves leave no gaps.
        workspace_id = tab["workspace_id"]
        positions[workspace_id] = positions.get(workspace_id, 0) + 1
        previous = records.get(tab_id)
        # Only remove a prefix if this plugin actually applied that exact label.
        # A manual rename (even to "2: notes") becomes the new original title.
        original = (
            previous["original"]
            if previous and label == previous["applied"]
            else label
        )
        desired = original if mode == "remove" else f'{positions[workspace_id]}: {original}'
        if desired != label:
            api.rename(tab_id, desired)
        if mode == "remove":
            records.pop(tab_id, None)
        else:
            records[tab_id] = {"original": original, "applied": desired}
        # Save before processing another tab: queued rename hooks then see our
        # ownership records and won't recursively add another numeric prefix.
        save(state)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("sync", "refresh", "remove"))
    args = parser.parse_args()
    root = Path(os.environ["HERDR_PLUGIN_STATE_DIR"])
    # Plugin state directories are global; tab IDs are session-local.
    session = os.environ["HERDR_SOCKET_PATH"]
    key = hashlib.sha256(session.encode()).hexdigest()[:24]
    root.mkdir(parents=True, exist_ok=True)
    path = root / f"{key}.json"
    with (root / f"{key}.lock").open("a") as lock:
        deadline = time.monotonic() + 30
        while True:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                break
            except BlockingIOError:
                if time.monotonic() >= deadline:
                    raise RuntimeError("Timed out waiting for tab-number synchronization")
                time.sleep(0.05)
        state = json.loads(path.read_text()) if path.exists() else {"enabled": True}
        reconcile(Herdr(), state, args.mode, lambda value: save_state(path, value))


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, RuntimeError, subprocess.SubprocessError) as error:
        print(f"tab-numbers: {error}", file=sys.stderr)
        sys.exit(1)
