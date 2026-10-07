"""
X31, for information: what the quarried rows' levels would be under the new tempo read. Not in any catalogue.

The build does not re-estimate a PDMX row: `import_pdmx.build_item` takes the row's stored `level` from
`content/sources/pdmx.json`, which the quarry wrote from the row's stored `features`. So X31 reaches those levels
only when the quarry measures the row again. This computes, per row, the duration feature at the new opening tempo
without re-measuring anything else: notesPerSecond = notesPerBar × max(1, bpm) / (beats × 60), which is the
feature's own formula with notes / bars written as the stored notesPerBar; bpm from `scripts-corpus-bpm.py`'s
"after" on the built file, beats its first time signature's numerator. It also checks the stored feature against
the same formula at the "before" reading, which says whether the stored row was measured at the tempo the old
read gives on today's built file.

    python docs/prompts/runs/X31/scripts-latent-levels.py <corpus-bpm.jsonl>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))

import difficulty  # noqa: E402


def band_in(node) -> list | None:  # noqa: ANN001
    """The first `levelBand` under a lesson (its finder's)."""
    if isinstance(node, dict):
        if isinstance(node.get("levelBand"), list):
            return node["levelBand"]
        for value in node.values():
            got = band_in(value)
            if got is not None:
                return got
    elif isinstance(node, list):
        for value in node:
            got = band_in(value)
            if got is not None:
                return got
    return None


def lessons_naming() -> dict[str, list[tuple[str, list | None]]]:
    found: dict[str, list[tuple[str, list | None]]] = {}

    def walk(node) -> None:  # noqa: ANN001
        if isinstance(node, dict):
            if isinstance(node.get("songOptions"), list) and node.get("id"):
                band = band_in(node)
                for item in node["songOptions"]:
                    found.setdefault(item, []).append((node["id"], band))
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    for path in sorted((ROOT / "content" / "curriculum").glob("stage-*.json")):
        walk(json.loads(path.read_text(encoding="utf-8")))
    return found


def main() -> int:
    probe = {}
    for line in Path(sys.argv[1]).read_text(encoding="utf-8").splitlines():
        if line.strip():
            row = json.loads(line)
            probe[row["id"]] = row
    rows = json.loads((ROOT / "content" / "sources" / "pdmx.json").read_text(encoding="utf-8"))["items"]
    model = difficulty.load_model()
    naming = lessons_naming()
    out: list[str] = []
    considered = consistent = 0
    moves = []
    skipped: dict[str, int] = {}
    for row in rows:
        features = row.get("features")
        if row.get("levelSource") != "estimated":
            skipped["not estimated"] = skipped.get("not estimated", 0) + 1
            continue
        if not features:
            skipped["no stored features"] = skipped.get("no stored features", 0) + 1
            continue
        measured = probe.get(row["id"])
        if not measured or "error" in measured:
            skipped["not in the built catalogue's scores"] = skipped.get("not in the built catalogue's scores", 0) + 1
            continue
        considered += 1
        beats, per_bar = measured["beats"], features.get("notesPerBar", 0.0)
        at_before = per_bar * max(1.0, measured["before"]) / (beats * 60.0)
        if abs(at_before - features.get("notesPerSecond", 0.0)) < 1e-6 * max(1.0, at_before):
            consistent += 1
        stored_level = difficulty.estimate(features, model).level
        changed = dict(features)
        changed["notesPerSecond"] = per_bar * max(1.0, measured["after"]) / (beats * 60.0)
        latent = difficulty.estimate(changed, model).level
        if abs(latent - stored_level) >= 0.005:
            moves.append((row["id"], row.get("level"), stored_level, latent, measured["before"], measured["after"]))
    out.append(f"quarried rows: {len(rows)}; estimated with stored features and a built file: {considered}; skipped: {skipped}")
    out.append(f"stored notesPerSecond equal to the formula at the old read on today's built file: {consistent} of {considered}")
    out.append(f"rows whose level would move (|change| >= 0.005): {len(moves)}")
    for bound in (0.1, 0.25, 0.5, 1.0):
        out.append(f"  |change| >= {bound}: {sum(1 for m in moves if abs(m[3] - m[2]) >= bound)}")
    up = sum(1 for m in moves if m[3] > m[2])
    out.append(f"  up {up}, down {len(moves) - up}")
    out.append("id\tcatalogue level\tstored features' level\tat the new tempo\tchange\tbpm before → after\tlessons naming it")
    def inside(level: float, band: list | None) -> bool | None:
        return None if not band else band[0] <= level <= band[1]

    crossings = []
    for item_id, catalogue, stored, latent, bpm_before, bpm_after in sorted(moves, key=lambda m: -abs(m[3] - m[2])):
        named = naming.get(item_id, [])
        lessons = ", ".join(f"{lesson} {band}" if band else lesson for lesson, band in named) or "none"
        out.append(f"{item_id}\t{catalogue}\t{stored}\t{latent}\t{latent - stored:+.2f}\t{bpm_before:g} → {bpm_after:g}\t{lessons}")
        for lesson, band in named:
            if band and inside(catalogue, band) != inside(latent, band):
                crossings.append(f"{item_id}\t{lesson} band {band}\tcatalogue {catalogue} → {latent} at the new tempo")
    out.append("")
    out.append(f"rung-named rows whose level at the new tempo would cross their lesson's finder levelBand: {len(crossings)}")
    out += crossings
    drift = sum(1 for row in rows if row.get("levelSource") == "estimated" and row.get("features")
                and abs(difficulty.estimate(row["features"], model).level - float(row.get("level", 0))) >= 0.005)
    out.append(f"(not X31's) estimated rows whose stored level differs from the committed model on their stored features: {drift} of {considered}")
    print("\n".join(out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
