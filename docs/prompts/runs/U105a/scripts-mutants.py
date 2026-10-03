"""U105a's mutants and base-red run, not for app/.

Run from the worktree root. Each mutant edits src/style.css in place (one or more
anchored replacements), rebuilds
the dist with `vite build` alone (a CSS change; tsc has nothing to check),
runs the two U105a browser cases on port 4793 through the config copy, records
the result, and restores the file byte for byte (in a finally). The base-red
run swaps ScoreScreen.ts for the base's bytes (git show 26a913fe:...), runs the
unit file, and restores it the same way. At the end the fixed dist is rebuilt
with `npm run build:app`.
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path.cwd()
APP = ROOT / "app"
OUT = ROOT / "build" / "u105a"
CSS = APP / "src" / "style.css"
SCREEN = APP / "src" / "ui" / "screens" / "ScoreScreen.ts"
CONFIG = "build/u105a/playwright.u105a-4793.config.ts"
GREP = "a refused tap on the summary"

# Each mutant: (name, what, [(old, new), ...]) — every pair applied, each anchor found exactly once.
# The anchors are the landing tree's `.summary-refusal` rules (U105a after the orchestrator's word:
# not painted by default, painted in the sideways query).
HIDDEN = "  position: absolute;\n  width: 1px;\n  height: 1px;\n  overflow: hidden;\n  clip: rect(0 0 0 0);\n  white-space: nowrap;\n  font-size: 0.85rem;"
PAINTED_UPRIGHT = "  margin: 0 0 0.5rem;\n  padding: 0.25rem 0;\n  white-space: normal;\n  font-size: 0.85rem;"
SIDEWAYS = "  .screen--score .summary-refusal {\n    position: sticky;\n    top: 0;\n"
MUTANTS = [
    (
        "m1-drawn-only-upright",
        "the line painted upright and hidden sideways",
        [(HIDDEN, PAINTED_UPRIGHT), (SIDEWAYS, "  .screen--score .summary-refusal {\n    display: none !important;\n    position: sticky;\n    top: 0;\n")],
    ),
    (
        "m2-cut-like-the-mirror",
        "the sideways line cut as the bar's mirror is: one line, 28vw, an ellipsis",
        [(
            "    white-space: normal;\n    overflow-wrap: anywhere;\n  }",
            "    white-space: nowrap;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    max-width: 28vw;\n  }",
        )],
    ),
    (
        "m3-not-held-at-the-top",
        "the sideways line not held at the sheet's top when the sheet scrolls (sticky removed)",
        [(SIDEWAYS, "  .screen--score .summary-refusal {\n    position: static;\n")],
    ),
    (
        "m4-hidden-sideways-too",
        "the sheet's line not painted sideways either (the sideways rule matches nothing)",
        [(SIDEWAYS, "  .screen--score .summary-refusal-unmatched {\n    position: sticky;\n    top: 0;\n")],
    ),
    (
        "m5-painted-upright-too",
        "the sheet's line painted upright as well as the header's: the sentence twice",
        [(HIDDEN, PAINTED_UPRIGHT)],
    ),
]


def run(cmd: str, cwd: pathlib.Path, log: pathlib.Path) -> int:
    with log.open("w", encoding="utf-8") as handle:
        done = subprocess.run(cmd, cwd=cwd, shell=True, stdout=handle, stderr=subprocess.STDOUT)
    return done.returncode


def main() -> int:
    """Arguments pick the steps: mutant names, `base`, `rebuild`; none runs all. One step per call keeps
    each call short, so no call is killed between the edit and its restore."""
    wanted = set(sys.argv[1:])
    everything = not wanted
    summary = []
    original_css = CSS.read_bytes()
    for name, what, pairs in MUTANTS:
        if not everything and name not in wanted:
            continue
        text = original_css.decode("utf-8")
        # The checkout may hold CRLF; match either.
        crlf = "\r\n" in text
        mutated = text
        missing = []
        for old, new in pairs:
            o = old.replace("\n", "\r\n") if crlf else old
            n = new.replace("\n", "\r\n") if crlf else new
            if mutated.count(o) != 1:
                missing.append(f"{mutated.count(o)}")
                continue
            mutated = mutated.replace(o, n)
        if missing:
            summary.append(f"{name}: an anchor found {', '.join(missing)} times, not applied")
            continue
        try:
            CSS.write_bytes(mutated.encode("utf-8"))
            built = run("npx vite build", APP, OUT / f"{name}-build.txt")
            tested = run(f'npx playwright test --config {CONFIG} score.screen.spec.ts -g "{GREP}"', APP, OUT / f"{name}.txt")
        finally:
            CSS.write_bytes(original_css)
        lines = (OUT / f"{name}.txt").read_text(encoding="utf-8", errors="replace").splitlines()
        results = [line.strip() for line in lines if line.strip().startswith(("ok ", "x ", "✘", "✓"))]
        summary.append(f"{name} ({what}): build exit {built}, spec exit {tested}")
        summary.extend(f"  {line}" for line in results)
    assert CSS.read_bytes() == original_css, "style.css not restored"

    # The unit file against the base's ScoreScreen.ts.
    fixed_screen = SCREEN.read_bytes()
    red = None
    try:
        if not everything and "base" not in wanted:
            raise LookupError
        base = subprocess.run(
            ["git", "show", "26a913fe:app/src/ui/screens/ScoreScreen.ts"], cwd=ROOT, capture_output=True, check=True
        ).stdout
        SCREEN.write_bytes(base)
        red = run(
            "npx vitest run tests/unit/scoreSheetsCloseAndPlayStartsSound.test.ts", APP, OUT / "unit-red-base.txt"
        )
    except LookupError:
        pass
    finally:
        SCREEN.write_bytes(fixed_screen)
    assert SCREEN.read_bytes() == fixed_screen, "ScoreScreen.ts not restored"
    if red is not None:
        summary.append(f"unit file against the base ScoreScreen.ts: exit {red}")

    # The U69 describe (U105's case and U105a's two) against a dist built from the base's
    # ScoreScreen.ts and style.css, the spec as it stands.
    if everything or "base-browser" in wanted:
        fixed_css = CSS.read_bytes()
        try:
            for path, rel in ((SCREEN, "app/src/ui/screens/ScoreScreen.ts"), (CSS, "app/src/style.css")):
                path.write_bytes(
                    subprocess.run(["git", "show", f"26a913fe:{rel}"], cwd=ROOT, capture_output=True, check=True).stdout
                )
            built = run("npx vite build", APP, OUT / "browser-red-base-build.txt")
            tested = run(
                f'npx playwright test --config {CONFIG} score.screen.spec.ts -g "after the sound was suspended"',
                APP,
                OUT / "browser-red-base.txt",
            )
            # The upright picture before, on the same base dist (the probe under app/build/u105a/probe).
            env_run = (
                "set U105A_TESTDIR=build/u105a/probe&& set U105A_LABEL=before&& "
                f'npx playwright test --config {CONFIG} -g "upright"'
            )
            pictured = run(env_run, APP, OUT / "pictures-before-upright.txt")
            summary.append(f"upright picture before, on the base dist: exit {pictured}")
        finally:
            SCREEN.write_bytes(fixed_screen)
            CSS.write_bytes(fixed_css)
        assert SCREEN.read_bytes() == fixed_screen and CSS.read_bytes() == fixed_css, "sources not restored"
        summary.append(f"U69 describe against the base dist: build exit {built}, spec exit {tested}")

    if everything or "rebuild" in wanted:
        rebuilt = run("npm run build:app", APP, OUT / "build-app-after-mutants.txt")
        summary.append(f"fixed dist rebuilt: exit {rebuilt}")
    with (OUT / "mutants.txt").open("a", encoding="utf-8") as handle:
        handle.write("\n".join(summary) + "\n")
    print("\n".join(summary))
    return 0


if __name__ == "__main__":
    sys.exit(main())
