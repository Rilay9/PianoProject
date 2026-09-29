"""
G1e ruling: run a vitest command with session.ts and help.ts at HEAD's bytes (the committed G1e, 8e640ee6) in
place of this tree's, then put this tree's back by their bytes (sha256 checked).
Usage (from the worktree root): python scripts-on-committed-g1e.py <log under runs/G1e/ruling> <vitest args...>
"""
import hashlib
import subprocess
import sys
from pathlib import Path

FILES = [Path("app/src/curriculum/session.ts"), Path("app/src/ui/help.ts")]
log = Path("docs/prompts/runs/G1e/ruling") / sys.argv[1]
args = sys.argv[2:]

saved = {}
for f in FILES:
    raw = f.read_bytes()
    saved[f] = (raw, hashlib.sha256(raw).hexdigest())
    head = subprocess.run(["git", "show", f"HEAD:{f.as_posix()}"], capture_output=True).stdout.replace(b"\r\n", b"\n")
    f.write_bytes(head.replace(b"\n", b"\r\n") if b"\r\n" in raw else head)
try:
    result = subprocess.run(["npx", "vitest", "run", *args], cwd="app", capture_output=True, text=True, encoding="utf-8", errors="replace", shell=True)
    text = f"session.ts and help.ts at HEAD's bytes (the committed G1e)\n\n{result.stdout}{result.stderr}\nexit={result.returncode}\n"
finally:
    for f, (raw, digest) in saved.items():
        f.write_bytes(raw)
        assert hashlib.sha256(f.read_bytes()).hexdigest() == digest, f"{f} not restored"
log.parent.mkdir(parents=True, exist_ok=True)
log.write_text(text + "".join(f"{f.as_posix()} restored, sha256 {d}\n" for f, (_, d) in saved.items()), encoding="utf-8")
print(text.splitlines()[-1])
