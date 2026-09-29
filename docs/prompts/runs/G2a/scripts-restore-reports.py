# G2a: the offline content build rewrote two tracked reports (docs/prompts/inventory.md and
# rung-claims.md) from a partial catalogue. Their HEAD content was written back with
# `git show HEAD:<path> > <path>` (LF); this puts the checkout's CRLF line endings back so the files
# are byte-identical to what the worktree was cut with (core.autocrlf=true), and prints the sha256 of
# each against the HEAD blob run through the same conversion. Run from the worktree root.
import hashlib
import subprocess

for path in ("docs/prompts/inventory.md", "docs/prompts/rung-claims.md"):
    blob = subprocess.run(["git", "show", f"HEAD:{path}"], capture_output=True, check=True).stdout
    crlf = blob.replace(b"\r\n", b"\n").replace(b"\n", b"\r\n")
    with open(path, "wb") as handle:
        handle.write(crlf)
    with open(path, "rb") as handle:
        now = handle.read()
    print(path, "restored;", "identical to HEAD (CRLF):", hashlib.sha256(now).hexdigest() == hashlib.sha256(crlf).hexdigest())
