"""
G1d (G1c's, narrowed to the two reports this worktree's offline build rewrote): HEAD's blob is written
with the checkout's line endings, then `git status` is asked whether the file still differs. Run from
the repository root.
"""
import hashlib
import subprocess

FILES = ["docs/prompts/inventory.md", "docs/prompts/rung-claims.md"]
for rel in FILES:
    blob = subprocess.run(["git", "show", f"HEAD:{rel}"], capture_output=True, check=True).stdout
    for data, how in ((blob.replace(b"\r\n", b"\n").replace(b"\n", b"\r\n"), "CRLF"), (blob, "as the blob")):
        open(rel, "wb").write(data)
        status = subprocess.run(["git", "status", "--porcelain", "--", rel], capture_output=True, text=True).stdout.strip()
        if status == "":
            break
    print(f"{rel}: HEAD's blob written {how}, sha256 {hashlib.sha256(data).hexdigest()}; git status: {status or 'clean'}")
