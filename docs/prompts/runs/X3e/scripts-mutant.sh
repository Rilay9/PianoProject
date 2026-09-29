#!/usr/bin/env bash
# X3e: one mutant at a time. Copies the source aside with its sha256, applies a python replacement that must
# match exactly once, runs the named unit files into the log, and restores the copy on every exit (a trap:
# the first version of this script died on an unbound variable after mutating and before restoring; the
# sources were put back by hand from its aside copies, checked, before any rerun).
# Usage: bash scripts-mutant.sh <log name> <source relative to app/> <python file holding OLD and NEW> <unit files...>
set -u
here="$(cd "$(dirname "$0")" && pwd)"
cd "$here/../../../../app" || exit 2
log="$here/$1"; source="$2"; mutant="$3"; edit="$here/$3"; shift 3
aside="$(mktemp)"
cp "$source" "$aside"
before="$(sha256sum "$source" | cut -d' ' -f1)"
restore() {
  cp "$aside" "$source"
  local after
  after="$(sha256sum "$source" | cut -d' ' -f1)"
  rm -f "$aside"
  if [ "$before" = "$after" ]; then echo "restored: sha256 OK $after" >> "$log"; else echo "restored: sha256 MISMATCH $before $after" >> "$log"; fi
}
trap restore EXIT
python - "$source" "$edit" <<'PY'
import sys
path, edit = sys.argv[1], sys.argv[2]
scope = {}
exec(open(edit, encoding="utf-8").read(), scope)
text = open(path, encoding="utf-8", newline="").read()
old, new = scope["OLD"], scope["NEW"]
if text.count(old) != 1:
    sys.exit(f"the mutant's text is found {text.count(old)} times, not once")
open(path, "w", encoding="utf-8", newline="").write(text.replace(old, new))
PY
applied=$?
{ echo "mutant: $mutant on $source (applied: exit $applied)"; npx vitest run "$@"; echo "exit $?"; } > "$log" 2>&1
