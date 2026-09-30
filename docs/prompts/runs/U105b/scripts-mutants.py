"""U105b's mutants, not for app/.

Run from the worktree root, one mutant per call: python build/u105b/mutants.py <name>.
Each edits app/src/style.css in place (anchored replacements, each anchor found exactly once),
rebuilds the dist with `vite build` alone (a CSS change; tsc has nothing to check), runs the named
browser specs on port 5283 through the config copy, records the exit code, and restores the file
byte for byte in a finally. `rebuild` rebuilds the fixed dist with `npm run build:app`.
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path.cwd()
APP = ROOT / "app"
OUT = ROOT / "build" / "u105b"
CSS = APP / "src" / "style.css"
CONFIG = "build/u105b/playwright.u105b-5283.config.ts"

REFUSAL_RULE = (
    "body:has([data-sound-refused]) .screen--score:not([data-running='true']) .score-head .help-strip__now {\n"
    "  white-space: normal;\n"
    "  overflow: visible;\n"
    "  text-overflow: clip;\n"
    "  overflow-wrap: anywhere;\n"
    "}"
)
RUN_CLAMP = (
    ".score-head .help-strip__what,\n"
    ".score-head .help-strip__now {\n"
    "  min-width: 0;\n"
    "  white-space: nowrap;\n"
)

MUTANTS = {
    "m1-refusal-clamped": (
        "the one-line clamp reinstated on the header's line in the refusal state (the fix undone, the run's clamp untouched)",
        [(REFUSAL_RULE, REFUSAL_RULE.replace(
            "  white-space: normal;\n  overflow: visible;\n  text-overflow: clip;\n  overflow-wrap: anywhere;\n",
            "  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n",
        ))],
        'tests/e2e/score.screen.spec.ts -g "a refused tap on the summary"',
    ),
    "m2-run-unclamped": (
        "the clamp taken off the header's now line in every state, a run's included (`.help-strip__what` keeps its own)",
        [(RUN_CLAMP, ".score-head .help-strip__what {\n  min-width: 0;\n  white-space: nowrap;\n")],
        "tests/e2e/score.fuzz.spec.ts tests/e2e/score.head-height.spec.ts",
    ),
    "m3-refusal-wraps-mid-run": (
        "the refusal rule without its no-run condition: the refusal's sentence wraps during a paused run or a demonstration too",
        [(REFUSAL_RULE, REFUSAL_RULE.replace(".screen--score:not([data-running='true']) ", ".screen--score "))],
        'tests/e2e/score.fuzz.spec.ts tests/e2e/score.head-height.spec.ts tests/e2e/score.screen.spec.ts -g "refused|never answers|suspended"',
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
    what, pairs, specs = MUTANTS[name]
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
        code = run(f"npx playwright test -c {CONFIG} {specs}", APP, OUT / f"{name}.txt")
        line = f"{name} ({what}): browser exit {code} ({'killed' if code != 0 else 'survived'})"
        print(line)
        with (OUT / "mutants.txt").open("a", encoding="utf-8") as handle:
            handle.write(line + "\n")
        return 0
    finally:
        CSS.write_bytes(original)


if __name__ == "__main__":
    sys.exit(main())
