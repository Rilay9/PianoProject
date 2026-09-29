"""
G1c: `session-run.spec.ts` (X1's, in the map's minimum for session.ts) writes its pictures into the
tracked docs/prompts/pictures/x1/ on every run, so the readers' run rewrote five of them. G1c changes
none of X1's pictures: each file git names modified there is written back with HEAD's bytes and git
is asked again. Run from the repository root.
"""
import hashlib
import subprocess

changed = subprocess.run(["git", "status", "--porcelain", "--", "docs/prompts/pictures/x1"], capture_output=True, text=True, check=True).stdout
paths = [line[3:].strip() for line in changed.splitlines() if line.startswith(" M ")]
for rel in paths:
    blob = subprocess.run(["git", "show", f"HEAD:{rel}"], capture_output=True, check=True).stdout
    with open(rel, "wb") as handle:
        handle.write(blob)
    status = subprocess.run(["git", "status", "--porcelain", "--", rel], capture_output=True, text=True).stdout.strip()
    print(f"{rel}: HEAD's blob written, sha256 {hashlib.sha256(blob).hexdigest()}; git status: {status or 'clean'}")
print(f"{len(paths)} restored")
