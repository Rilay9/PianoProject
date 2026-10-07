"""U105c's mutant, not for app/.

Run from the worktree root: python build/u105c/mutants.py m1-no-run-restriction-back, then
python build/u105c/mutants.py rebuild. The mutant edits app/src/style.css in place (an anchored
replacement, found exactly once), rebuilds the dist with `vite build` alone (a CSS change; tsc has
nothing to check), runs two browser invocations on port 5293 through the config copy — the U69
describe of score.screen.spec.ts (every refusal case: the three no-run ones, U105b's three, and the
new paused one), then score.fuzz.spec.ts and score.head-height.spec.ts with no -g, so the grep does
not filter them out (U105b's m3 run did) — records each exit code, and restores the file byte for
byte in a finally. `rebuild` rebuilds the fixed dist with `npm run build:app`.
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path.cwd()
APP = ROOT / "app"
OUT = ROOT / "build" / "u105c"
CSS = APP / "src" / "style.css"
CONFIG = "build/u105c/playwright.u105c-5293.config.ts"

FIXED = "body:has([data-sound-refused]) .screen--score .score-head .help-strip__now {"
SCOPED = "body:has([data-sound-refused]) .screen--score:not([data-running='true']) .score-head .help-strip__now {"

MUTANTS = {
    "m1-no-run-restriction-back": (
        "the refusal rule with U105b's no-run condition reinstated (`:not([data-running='true'])`)",
        [(FIXED, SCOPED)],
        [
            ("u69", 'tests/e2e/score.screen.spec.ts -g "U69"'),
            ("guard", "tests/e2e/score.fuzz.spec.ts tests/e2e/score.head-height.spec.ts"),
        ],
    ),
}


def run(cmd: str, cwd: pathlib.Path, log: pathlib.Path) -> int:
    with log.open("w", encoding="utf-8") as handle:
        done = subprocess.run(cmd, cwd=cwd, shell=True, stdout=handle, stderr=subprocess.STDOUT)
        handle.write(f"exit {done.returncode}\n")
    return done.returncode


def main() -> int:
    name = sys.argv[1]
    if name == "rebuild":
        code = run("npm run build:app", APP, OUT / "build-app-after-mutants.txt")
        print(f"rebuild: exit {code}")
        return code
    what, pairs, runs = MUTANTS[name]
    original = CSS.read_bytes()
    text = original.decode("utf-8")
    crlf = "\r\n" in text
    try:
        for old, new in pairs:
            if crlf:
                old, new = old.replace("\n", "\r\n"), new.replace("\n", "\r\n")
            count = text.count(old)
            if count != 1:
                print(f"{name}: anchor found {count} times, not once; nothing run")
                return 2
            text = text.replace(old, new)
        CSS.write_bytes(text.encode("utf-8"))
        build = run("npx vite build", APP, OUT / f"{name}-build.txt")
        if build != 0:
            print(f"{name}: vite build exit {build}")
            return 3
        for label, specs in runs:
            code = run(f"npx playwright test -c {CONFIG} {specs}", APP, OUT / f"{name}-{label}.txt")
            line = f"{name} ({what}) [{label}: {specs}]: browser exit {code} ({'killed' if code != 0 else 'survived'})"
            print(line)
            with (OUT / "mutants.txt").open("a", encoding="utf-8") as handle:
                handle.write(line + "\n")
        return 0
    finally:
        CSS.write_bytes(original)


if __name__ == "__main__":
    sys.exit(main())
