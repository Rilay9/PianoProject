"""U118's mutants, and the code before U118 as one more: each applied to the source, built, the U118 browser
cases and the renderer's stage unit test run, then the source restored byte for byte. Run from the worktree
root, with no other Playwright run going (the build replaces `app/dist` under the preview server).

    base  the code before U118 (`git show HEAD:` of the two source files), the U118 tests kept
    M1    placement removed: the stacked slots stack from 0 whatever the band
    M2    the band priced on an ordinary fold: the fold lets the run's size go and takes it again
    M3    a status change re-prices: the band follows the sentence the chip shows now, and every change
          of the chip places the slots again
    M4    a fixed two-line band, where one line fits
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()
APP = ROOT / "app"
OUT = ROOT / "build" / "u118" / "mutants"
WR = APP / "src/score/WindowRenderer.ts"
SS = APP / "src/ui/screens/ScoreScreen.ts"
GREP = "chip|folded|tablet folds|every sentence"
CONFIG = "build/u118/playwright.u118-5313.config.ts"

MUTANTS: dict[str, list[tuple[Path, str, str]]] = {
    "M1": [(WR, "    const origin = Math.ceil(this.foldedReserve());", "    const origin = 0;")],
    "M2": [
        (
            WR,
            "    if (this.disposed || this.layout !== 'window' || this.readAhead !== 'slots' || this.lastPack.length === 0) return;\n    this.packSlots(this.lastPack);",
            "    if (this.disposed || this.layout !== 'window' || this.readAhead !== 'slots' || this.lastPack.length === 0) return;\n    if (this.running && this.frozen && this.foldedReserve() > 0) {\n      this.frozen = null;\n      this.freezeAfterSettle();\n    }\n    this.packSlots(this.lastPack);",
        )
    ],
    "M3": [
        (SS, "    if (cornerBand?.key === key) return cornerBand.px;\n", ""),
        (SS, "    for (const text of cornerTexts()) {", "    for (const text of [corner.textContent ?? '']) {"),
        (
            SS,
            "      .filter((text) => text !== null && text !== '')\n      .join(' · ');\n",
            "      .filter((text) => text !== null && text !== '')\n      .join(' · ');\n    renderer?.placeSlots();\n",
        ),
    ],
    "M4": [(SS, "      copy.textContent = text;", "      copy.innerHTML = 'x<br>x';")],
}


def run(cmd: list[str], log: Path, cwd: Path = APP) -> int:
    with log.open("w", encoding="utf-8") as f:
        return subprocess.call(cmd, cwd=cwd, stdout=f, stderr=subprocess.STDOUT, shell=(sys.platform == "win32"))


def summary(log: Path) -> str:
    lines = log.read_text(encoding="utf-8", errors="replace").splitlines()
    keep = [l.strip() for l in lines if l.strip().startswith(("ok ", "x ", "✓", "×")) or " passed" in l or " failed" in l or "Tests " in l]
    return "\n".join(keep)


def main() -> None:
    which = sys.argv[1:] or ["base", "M1", "M2", "M3", "M4"]
    OUT.mkdir(parents=True, exist_ok=True)
    saved = {p: p.read_bytes() for p in (WR, SS)}
    report = []
    try:
        for name in which:
            for p, data in saved.items():
                p.write_bytes(data)
            if name == "base":
                for p in (WR, SS):
                    rel = p.relative_to(ROOT).as_posix()
                    p.write_bytes(subprocess.check_output(["git", "show", f"HEAD:{rel}"], cwd=ROOT))
            else:
                for path, old, new in MUTANTS[name]:
                    text = path.read_bytes().decode("utf-8")
                    crlf = "\r\n" in text
                    norm = text.replace("\r\n", "\n")
                    assert norm.count(old) == 1, f"{name}: anchor found {norm.count(old)} times in {path.name}"
                    norm = norm.replace(old, new)
                    path.write_bytes((norm.replace("\n", "\r\n") if crlf else norm).encode("utf-8"))
            build = run(["npx", "vite", "build"], OUT / f"{name}-build.txt")
            if build != 0:
                report.append(f"## {name}\nbuild exit {build}\n")
                continue
            browser = run(["npx", "playwright", "test", "-c", CONFIG, "tests/e2e/score.window-rule.spec.ts", "-g", GREP], OUT / f"{name}-browser.txt")
            unit = run(["npx", "vitest", "run", "tests/unit/windowRendererStage.test.ts", "-t", "U118"], OUT / f"{name}-unit.txt")
            report.append(
                f"## {name}\nbuild exit {build}; browser exit {browser}; unit exit {unit}\n\n{summary(OUT / f'{name}-browser.txt')}\n\n{summary(OUT / f'{name}-unit.txt')}\n"
            )
            print(f"{name}: browser {browser}, unit {unit}", flush=True)
    finally:
        for p, data in saved.items():
            p.write_bytes(data)
        restored = all(p.read_bytes() == data for p, data in saved.items())
        report.append(f"source restored byte for byte: {restored}\n")
        (OUT / "mutants.md").write_text("\n".join(report), encoding="utf-8")
        print(f"restored: {restored}")


if __name__ == "__main__":
    main()
