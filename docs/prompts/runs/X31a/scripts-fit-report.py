"""
X31a's fit report, for information only (X31's script, X31a's two reads): `difficulty.fit` on the same
calibration set as `fit_level_model.py` (every judged song in the built catalogue with a score file), once with
the duration feature's tempo read as X31 shipped it and once as X31a reads it. Nothing is written:
`level-model.json` stays as committed, and so does every weight.

"Before" replaces `difficulty.opening_quarter_bpm` in this process with X31's reading, replicated here: the
readable mark at the earliest offset (ties to the first in `recurse()`), in quarter notes a minute, else 100,
whatever sounded before it. Each file is parsed once and measured both ways.

Also printed: the committed model itself on the same samples, both ways (its Spearman and median absolute error
in sample, since the committed weights are what the build and the app use).

    python docs/prompts/runs/X31a/scripts-fit-report.py <content dir>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))

import difficulty  # noqa: E402

NEW_READ = difficulty.opening_quarter_bpm


def committed_read(score) -> float:  # noqa: ANN001 - X31's reading, replicated
    import math

    best = None
    opening = difficulty.DEFAULT_BPM
    for order, mark in enumerate(score.recurse().getElementsByClass("MetronomeMark")):
        bpm = difficulty._quarter_bpm(mark)  # noqa: SLF001
        if bpm is None:
            continue
        try:
            offset = float(mark.getOffsetInHierarchy(score))
        except Exception:  # noqa: BLE001
            offset = math.inf
        if best is None or (offset, order) < best:
            best = (offset, order)
            opening = bpm
    return opening


def report(name: str, samples: list[difficulty.Sample], model: dict) -> list[str]:
    out = [f"== {name}"]
    fitted = difficulty.fit(samples)
    out.append(f"refit (not written): {fitted.summary()}")
    if fitted.dropped_features:
        out.append(f"  dropped (weight came out backwards): {', '.join(fitted.dropped_features)}")
    out.append("  weights, largest first:")
    for feature, weight in sorted(fitted.model.get("weights", {}).items(), key=lambda pair: -abs(pair[1]))[:10]:
        out.append(f"    {weight:+8.4f}  {feature}")
    guesses = [difficulty.estimate(s.features, model).level for s in samples]
    errors = sorted(abs(g - s.level) for g, s in zip(guesses, samples))
    median = errors[len(errors) // 2] if errors else 0.0
    out.append(f"the committed model on the same samples, in sample: Spearman {difficulty.spearman(guesses, [s.level for s in samples]):.3f}, "
               f"median |error| {median:.3f} stages")
    return out


def main() -> int:
    from convert import parse_source

    content = Path(sys.argv[1])
    catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
    judged = [
        item for item in catalog
        if item.get("type") == "song" and item.get("levelSource") == "judged" and item.get("file")
        and not str(item["file"]).lower().endswith(".pdf")
    ]
    before: list[difficulty.Sample] = []
    after: list[difficulty.Sample] = []
    moved: list[str] = []
    skipped: list[str] = []
    for item in judged:
        path = content / item["file"]
        if not path.is_file():
            skipped.append(f"{item['id']}: no file")
            continue
        try:
            score = parse_source(path)
            difficulty.opening_quarter_bpm = committed_read
            old = difficulty.features(score)
            difficulty.opening_quarter_bpm = NEW_READ
            new = difficulty.features(score)
        except Exception as error:  # noqa: BLE001 - a file that will not parse is not a sample
            difficulty.opening_quarter_bpm = NEW_READ
            skipped.append(f"{item['id']}: {type(error).__name__}")
            continue
        before.append(difficulty.Sample(features=old, level=float(item["level"]), id=item["id"]))
        after.append(difficulty.Sample(features=new, level=float(item["level"]), id=item["id"]))
        if abs(old["notesPerSecond"] - new["notesPerSecond"]) > 1e-9:
            moved.append(f"{item['id']}: notesPerSecond {old['notesPerSecond']:.4f} → {new['notesPerSecond']:.4f}")
    model = difficulty.load_model()
    out = [f"calibration set: {len(after)} judged song(s); skipped {len(skipped)}"]
    out += [f"  skipped {line}" for line in skipped]
    out.append(f"samples whose duration feature X31a moves: {len(moved)}")
    out += [f"  {line}" for line in moved]
    out += report("before (X31's tempo read)", before, model)
    out += report("after (X31a's tempo read)", after, model)
    print("\n".join(out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
