#!/usr/bin/env python3
"""
Register the project's hooks in the settings file the owner's sessions actually load.

Sessions start in the parent folder "Piano Stuff" (the process review of 2026-10-08 found the
hooks registered only in PianoProject/.claude/settings.json, which those sessions never read).
This script writes the hooks section of <session folder>/.claude/settings.local.json from the
repo, leaving every other setting (permissions) untouched, so the repo stays the one source.

    python .claude/hooks/install_hooks.py ["C:/Users/yalir/repos/Piano Stuff"]
"""
import io
import json
import os
import sys

HOOKS = os.path.dirname(os.path.abspath(__file__)).replace("\\", "/")
SESSION = sys.argv[1] if len(sys.argv) > 1 else os.path.abspath(os.path.join(HOOKS, "..", "..", ".."))
TARGET = os.path.join(SESSION, ".claude", "settings.local.json")


def cmd(script, timeout, label, matcher=None):
    entry = {"hooks": [{"type": "command", "command": f'node "{HOOKS}/{script}"', "timeout": timeout, "statusMessage": label}]}
    if matcher:
        entry = {"matcher": matcher, **entry}
    return entry


auditor = io.open(os.path.join(HOOKS, "brief-auditor-prompt.md"), encoding="utf-8").read()

hooks = {
    "Stop": [cmd("stop-checklist.js", 10, "Checklist pass")],
    "SubagentStop": [cmd("stop-checklist.js", 10, "Checklist pass")],
    "PostToolUse": [{"matcher": "Bash|Write|Edit", "hooks": [{"type": "command", "command": f'node "{HOOKS}/diff-growth.js"', "timeout": 20}]}],
    "PreToolUse": [
        cmd("brief-check.js", 10, "Brief check", "Agent|SendMessage"),
        # The independent brief auditor (process review P1): Agent calls only; agent hooks block on timeout.
        {"matcher": "Agent", "hooks": [{"type": "agent", "prompt": auditor, "timeout": 240, "statusMessage": "Brief auditor"}]},
    ],
    "SessionStart": [cmd("session-selftest.js", 20, "Hook self-test")],
}

settings = {}
if os.path.exists(TARGET):
    settings = json.loads(io.open(TARGET, encoding="utf-8").read())
settings["hooks"] = hooks
os.makedirs(os.path.dirname(TARGET), exist_ok=True)
io.open(TARGET, "w", encoding="utf-8", newline="\n").write(json.dumps(settings, indent=2) + "\n")
print("hooks written to", TARGET)
