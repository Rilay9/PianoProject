"""
Fits `content/sources/level-model.json` on the songs a person levelled (§2.4).

The calibration set is every **song** in the built catalog whose `levelSource`
is `judged` — the MuseTrainer items whose level was typed in by hand, the
authored tunes, the hand-levelled Joplin rags, the Chopin overrides. Those are
the only levels in the library that came from a judgement about that piece
rather than from a formula, so they are the only thing a formula can be fitted
against.

Exercises are excluded on purpose. Their levels come from P12a's parameter
table — key, span, rhythm — so fitting a difficulty model on them would be
fitting one formula to another and would report a beautiful correlation with
nothing.

The bar for using the result at all is replan §2.4's: Spearman ≥ 0.8 and
leave-one-out median absolute error ≤ 0.7 stages. Below it, the fallback table
stays and this says so rather than committing a model nobody should trust.

    python3 tools/content/fit_level_model.py            # report only
    python3 tools/content/fit_level_model.py --write    # …and commit it if it passes
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import difficulty  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONTENT = REPO_ROOT / "app" / "public" / "content"


def calibration_set(content_dir: Path, limit: int = 0) -> list[difficulty.Sample]:
    from convert import parse_source

    catalog = json.loads((content_dir / "catalog.json").read_text(encoding="utf-8"))
    judged = [
        item
        for item in catalog
        if item.get("type") == "song"
        and item.get("levelSource") == "judged"
        and item.get("file")
        and not str(item["file"]).lower().endswith(".pdf")
    ]
    if limit:
        judged = judged[:limit]

    samples: list[difficulty.Sample] = []
    failed: list[str] = []
    for index, item in enumerate(judged, 1):
        path = content_dir / item["file"]
        if not path.is_file():
            failed.append(f"{item['id']}: no file")
            continue
        try:
            score = parse_source(path)
            samples.append(
                difficulty.Sample(
                    features=difficulty.features(score),
                    level=float(item["level"]),
                    id=item["id"],
                )
            )
        except Exception as error:  # noqa: BLE001 - a file we cannot parse is not a sample
            failed.append(f"{item['id']}: {type(error).__name__}")
        if index % 25 == 0:
            print(f"  …{index}/{len(judged)} parsed", file=sys.stderr, flush=True)

    for line in failed[:10]:
        print(f"  skipped {line}", file=sys.stderr)
    if len(failed) > 10:
        print(f"  …and {len(failed) - 10} more skipped", file=sys.stderr)
    return samples


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--content", type=Path, default=DEFAULT_CONTENT)
    parser.add_argument("--out", type=Path, default=difficulty.MODEL_FILE)
    parser.add_argument("--limit", type=int, default=0, help="fewer samples, for a smoke test")
    parser.add_argument(
        "--write",
        action="store_true",
        help="commit the fitted model — only does so when it meets the §2.4 bar",
    )
    args = parser.parse_args(argv)

    samples = calibration_set(args.content, args.limit)
    print(f"calibration set: {len(samples)} judged song(s)")
    if len(samples) < 20:
        print("too few to fit anything; keeping the fallback table", file=sys.stderr)
        return 1

    report = difficulty.fit(samples)
    print(report.summary())
    if report.dropped_features:
        print(f"dropped (weight came out backwards): {', '.join(report.dropped_features)}")
    weights = report.model.get("weights", {})
    print("weights, largest first:")
    for name, weight in sorted(weights.items(), key=lambda pair: -abs(pair[1]))[:10]:
        print(f"  {weight:+8.4f}  {name}")

    # The worst misses, because a median error hides the piece it is wrong about
    # by two whole stages and that piece is the one worth looking at.
    guesses = [
        (abs(difficulty.estimate(s.features, report.model).level - s.level), s)
        for s in samples
    ]
    guesses.sort(key=lambda pair: -pair[0])
    print("furthest from the judgement:")
    for error, sample in guesses[:8]:
        guess = difficulty.estimate(sample.features, report.model).level
        print(f"  {error:5.2f}  {sample.id} — judged {sample.level:g}, model {guess:g}")

    if not report.meets_bar:
        print(
            "\nBelow the bar (Spearman >= 0.8, leave-one-out median |error| <= 0.7). "
            "The fallback table stays.",
        )
        return 0

    if args.write:
        existing = json.loads(args.out.read_text(encoding="utf-8"))
        model = {**existing, **report.model}
        model["fallback"] = existing.get("fallback", {})
        args.out.write_text(json.dumps(model, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"\nwrote {args.out}")
    else:
        print("\nMeets the bar. Re-run with --write to commit it.")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
