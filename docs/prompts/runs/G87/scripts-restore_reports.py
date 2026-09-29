"""
G87 (G1c's, as it ran there): put the three reports the offline build rewrites back to HEAD's bytes.
After the second build (content-build-2.log, with the mutopia edition) inventory.md and rung-claims.md
differed from HEAD in line endings only and SOURCES.md in its fetch dates and revisions, as on G1c's
build. HEAD's blob is written with the checkout's line endings, then `git status` is asked whether the
file still differs. Run from the worktree root.
"""
import hashlib
import subprocess

FILES = ["content/scores/imported/SOURCES.md", "docs/prompts/inventory.md", "docs/prompts/rung-claims.md"]
for rel in FILES:
    blob = subprocess.run(["git", "show", f"HEAD:{rel}"], capture_output=True, check=True).stdout
    for data, how in ((blob.replace(b"\r\n", b"\n").replace(b"\n", b"\r\n"), "CRLF"), (blob, "as the blob")):
        open(rel, "wb").write(data)
        status = subprocess.run(["git", "status", "--porcelain", "--", rel], capture_output=True, text=True).stdout.strip()
        if status == "":
            break
    print(f"{rel}: HEAD's blob written {how}, sha256 {hashlib.sha256(data).hexdigest()}; git status: {status or 'clean'}")
