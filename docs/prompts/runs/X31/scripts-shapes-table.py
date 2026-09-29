"""
X31's shape table: each MusicXML shape of `app/tests/unit/tempoFromXml.test.ts`, as `test_difficulty.py` builds it,
read by the build before X31 (the committed expression, replicated) and after, beside the app's opening tempo.

    python docs/prompts/runs/X31/scripts-shapes-table.py
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))
sys.path.insert(0, str(ROOT / "tools" / "content" / "tests"))

import difficulty  # noqa: E402
import test_difficulty as shapes  # noqa: E402

NEW_READ = difficulty.opening_quarter_bpm


def committed_read(score) -> float:  # noqa: ANN001 - the committed expression, replicated
    tempos = list(score.recurse().getElementsByClass("MetronomeMark"))
    return float(tempos[0].number) if tempos and tempos[0].number else 100.0


def main() -> int:
    from music21 import converter

    rows = ["| Shape | App opens at | Build before | Build after | Agree after |", "| --- | --- | --- | --- | --- |"]
    agree_before = agree_after = 0
    table = shapes._app_shapes()  # noqa: SLF001
    for name, (xml, beats, app, _expected) in table.items():
        score = converter.parseData(xml, format="musicxml")
        difficulty.opening_quarter_bpm = committed_read
        before = shapes._tempo_read(score, beats)  # noqa: SLF001
        difficulty.opening_quarter_bpm = NEW_READ
        after = shapes._tempo_read(score, beats)  # noqa: SLF001
        agree_before += abs(before - app) < 1e-6
        ok = abs(after - app) < 1e-6
        agree_after += ok
        why = "" if ok else f" — {shapes._GAPS.get(name, 'NOT NAMED')}"  # noqa: SLF001
        rows.append(f"| {name} | {app:g} | {before:.6g} | {after:.6g} | {'yes' if ok else 'no' + why} |")
    print(f"shapes: {len(table)}; the build agrees with the app before X31 on {agree_before}, after on {agree_after}\n")
    print("\n".join(rows))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
