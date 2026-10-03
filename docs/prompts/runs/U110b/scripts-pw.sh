#!/bin/bash
# Takes the shared Playwright lock, runs one command from app/, releases the lock on any exit.
LOCK=<home>/repos/pw-lock
until mkdir "$LOCK" 2>/dev/null; do sleep 20; done
trap 'rmdir "$LOCK" 2>/dev/null' EXIT INT TERM
cd "$(dirname "$0")/../.."
"$@"
