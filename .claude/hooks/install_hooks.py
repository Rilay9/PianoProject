#!/usr/bin/env python3
"""
Register the project's hooks in the settings file the owner's sessions actually load.

Sessions start in the parent folder "Piano Stuff" (the process review of 2026-10-08 found the
hooks registered only in PianoProject/.claude/settings.json, which those sessions never read).
This script writes the hooks section of <session folder>/.claude/settings.local.json from the
repo, leaving every other setting (permissions) untouched, so the repo stays the one source. It
writes the same hooks into the repo's own .claude/settings.json (paths through $CLAUDE_PROJECT_DIR),
so a session opened on PianoProject itself runs the same set and the self-test passes in both
(2026-10-09: the two registrations had drifted; settings.json lacked the brief auditor).

    python .claude/hooks/install_hooks.py ["C:/Users/yalir/repos/Piano Stuff"]
"""
import io
import json
import os
import sys

HOOKS = os.path.dirname(os.path.abspath(__file__)).replace("\\", "/")
SESSION = sys.argv[1] if len(sys.argv) > 1 else os.path.abspath(os.path.join(HOOKS, "..", "..", ".."))
TARGET = os.path.join(SESSION, ".claude", "settings.local.json")


def build(prefix):
    def cmd(script, timeout, label, matcher=None):
        entry = {"hooks": [{"type": "command", "command": f'node "{prefix}/{script}"', "timeout": timeout, "statusMessage": label}]}
        if matcher:
            entry = {"matcher": matcher, **entry}
        return entry

    return {
        "Stop": [cmd("stop-checklist.js", 10, "Checklist pass")],
        "SubagentStop": [cmd("stop-checklist.js", 10, "Checklist pass")],
        "PostToolUse": [{"matcher": "Bash|Write|Edit", "hooks": [{"type": "command", "command": f'node "{prefix}/diff-growth.js"', "timeout": 20}]}],
        "PreToolUse": [
            cmd("brief-check.js", 10, "Brief check", "Agent|SendMessage"),
            # The independent brief auditor (process review P1): Agent calls only; agent hooks block on timeout.
            {"matcher": "Agent", "hooks": [{"type": "agent", "prompt": auditor, "timeout": 240, "statusMessage": "Brief auditor"}]},
        ],
        "SessionStart": [cmd("session-selftest.js", 20, "Hook self-test")],
    }


auditor = io.open(os.path.join(HOOKS, "brief-auditor-prompt.md"), encoding="utf-8").read()


def write(target, hooks):
    settings = {}
    if os.path.exists(target):
        settings = json.loads(io.open(target, encoding="utf-8").read())
    settings["hooks"] = hooks
    os.makedirs(os.path.dirname(target), exist_ok=True)
    io.open(target, "w", encoding="utf-8", newline="\n").write(json.dumps(settings, indent=2) + "\n")
    print("hooks written to", target)


write(TARGET, build(HOOKS))
write(os.path.join(HOOKS, "..", "settings.json"), build("$CLAUDE_PROJECT_DIR/.claude/hooks"))
