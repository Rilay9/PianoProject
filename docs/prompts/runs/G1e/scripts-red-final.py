"""
G1e: the final unit tests on the committed code, captured whole. session.ts is swapped for HEAD's bytes, the
three files run, and this tree's session.ts is put back by its bytes (sha256 checked). Run from the worktree
root; writes docs/prompts/runs/G1e/red/red-vitest-committed-code-final.txt.
"""
import hashlib
import subprocess
from pathlib import Path

SESSION = Path("app/src/curriculum/session.ts")
OUT = Path("docs/prompts/runs/G1e/red/red-vitest-committed-code-final.txt")
TESTS = ["tests/unit/repertoireRetention.test.ts", "tests/unit/transferOffer.test.ts", "tests/unit/projectLifecycle.test.ts"]

original = SESSION.read_bytes()
digest = hashlib.sha256(original).hexdigest()
committed = subprocess.run(["git", "show", f"HEAD:{SESSION.as_posix()}"], capture_output=True).stdout
crlf = b"\r\n" in original
body = committed.replace(b"\r\n", b"\n")
SESSION.write_bytes(body.replace(b"\n", b"\r\n") if crlf else body)
try:
    result = subprocess.run(["npx", "vitest", "run", *TESTS], cwd="app", capture_output=True, text=True, encoding="utf-8", errors="replace", shell=True)
    text = f"session.ts: HEAD's bytes (sha256 {hashlib.sha256(committed).hexdigest()}) in place of this tree's\n\n{result.stdout}{result.stderr}\nexit={result.returncode}\n"
finally:
    SESSION.write_bytes(original)
    assert hashlib.sha256(SESSION.read_bytes()).hexdigest() == digest, "session.ts not restored"
OUT.write_text(text + f"session.ts restored, sha256 {digest}\n", encoding="utf-8")
print(text.splitlines()[-1])
