"""U105d's mutant, not for app/. Run from the worktree's app/.

m1-cut-restored: the refused mirror's rule removed whole (selector and body), so `.score-bar__status` is
back to one line at `28vw` with an ellipsis in the refusal state too, as on the committed CSS.

Writes the mutant, `vite build`s it, runs the whole score.screen.spec.ts on port 5303 through the config
copy, then restores style.css byte for byte (checked by hash). The fixed dist is rebuilt by the caller.
"""
import hashlib
import pathlib
import subprocess
import sys

APP = pathlib.Path.cwd()
CSS = APP / "src" / "style.css"
OUT = APP.parent / "build" / "u105d"
CONFIG = "build/u105d/playwright.u105d-5303.config.ts"

START = "body:has([data-sound-refused]) .screen--score .score-bar__status {"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def run(cmd: str, log: pathlib.Path) -> int:
    with log.open("w", encoding="utf-8") as fh:
        code = subprocess.call(cmd, shell=True, cwd=APP, stdout=fh, stderr=subprocess.STDOUT)
        fh.write(f"exit {code}\n")
    return code


original = CSS.read_bytes()
before = sha(original)
text = original.decode("utf-8")
at = text.index(START)
end = text.index("}", at) + 1
mutant = text[:at] + text[end:]
assert START not in mutant, "the rule is still in the mutant"
summary = []
try:
    CSS.write_bytes(mutant.encode("utf-8"))
    build = run("npx vite build", OUT / "m1-cut-restored-build.txt")
    summary.append(f"m1-cut-restored: vite build exit {build}")
    if build == 0:
        spec = run(
            f"npx playwright test -c {CONFIG} tests/e2e/score.screen.spec.ts",
            OUT / "m1-cut-restored-score-screen.txt",
        )
        summary.append(f"m1-cut-restored: score.screen.spec.ts exit {spec}")
finally:
    CSS.write_bytes(original)
after = sha(CSS.read_bytes())
summary.append(f"style.css restored: {'yes' if after == before else 'NO'} (sha256 {after})")
(OUT / "mutants.txt").write_text("\n".join(summary) + "\n", encoding="utf-8")
print("\n".join(summary))
sys.exit(0 if after == before else 1)
