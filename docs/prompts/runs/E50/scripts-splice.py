"""
E50 items 6 and 7: the seven `content/sources/pdmx.json` rows respliced as text, and each level reported three ways.

    python scripts-splice.py <base sha>

Per row, from the files already in `content/scores/pdmx/` (item 5's copy):
  - the level three ways: the stored level; the committed code (`difficulty.features` and `difficulty.estimate`,
    unchanged by E50) on the committed file at <base sha> (`git show`, read only); the committed code on the new file;
  - the features: the committed file's must equal the stored ones, all nineteen; the new file's must equal them but
    for `notesPerSecond`, the one tempo-dependent feature;
  - the rungs holding the row (`content/curriculum/stage-*.json`: song, exercise and paper options) with their
    `levelBand`, in or out at the new level (X37: reported, never widened, moved or kept).
The splice: the round trip `json.dumps(json.loads(raw), indent=2, ensure_ascii=False)` is compared with the raw bytes
first (operating-procedure §11); the rows are spliced as text either way, inside each row's own block, one match per
field: `convertedSha256`, `tempoBpm`, `tempoDefaulted`, `features.notesPerSecond`, `level`, `levelFrom`,
`levelDrivers`. Afterwards the parsed file is compared with the parsed original: nothing but those fields on those
rows moved, and the `review` object of each is byte-identical. Output: runs/E50/splice.txt.
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

W = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(W / "tools" / "content"))
import difficulty  # noqa: E402
from convert import parse_source  # noqa: E402

TABLE = W / "content" / "sources" / "pdmx.json"
LOG = W / "docs" / "prompts" / "runs" / "E50" / "splice.txt"
SEVEN = ["song.pop.margie.pdmx", "song.jazz.django-reinhardt-limehouse-blues.pdmx", "song.blues.singin-the-blues",
         "song.blues.weary-blues", "song.blues.storyville-blues", "song.blues.wabash-blues", "song.blues.tishomingo-blues"]
#: The convention of the rows measured under the committed model (Entry 53, 23b1f3d7: the refit of 2026-09-22).
LEVEL_FROM = "model-2026-09-22"
CHANGED = {"convertedSha256", "tempoBpm", "tempoDefaulted", "features", "level", "levelFrom", "levelDrivers"}


def measure(path: Path, model: dict) -> tuple[dict, float, list]:
    features = difficulty.features(parse_source(path))
    estimate = difficulty.estimate(features, model)
    return features, estimate.level, [[name, value] for name, value in estimate.drivers]


def rungs_of(item_id: str) -> list[tuple[str, list[float]]]:
    out = []
    for stage in sorted((W / "content" / "curriculum").glob("stage-*.json")):
        for block in json.loads(stage.read_text(encoding="utf-8")).get("stages", []):
            for unit in block.get("units", []):
                for lesson in unit.get("lessons", []):
                    options = lesson.get("songOptions", []) + lesson.get("exerciseOptions", []) + lesson.get("paperOptions", [])
                    if item_id in options:
                        out.append((f"{lesson['id']} ({stage.name})", lesson.get("levelBand")))
    return out


def one(pattern: str, block: str, replacement: str, field: str) -> str:
    found = list(re.finditer(pattern, block, re.S))
    if len(found) != 1:
        raise SystemExit(f"STOP: {field} matched {len(found)} times in its row")
    return block[: found[0].start(1)] + replacement + block[found[0].end(1):]


def main(argv: list[str]) -> int:
    base = argv[0]
    raw = TABLE.read_bytes()
    text = raw.decode("utf-8")
    before = json.loads(text)
    round_trip = (json.dumps(before, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    lines = [f"round trip of pdmx.json byte-identical: {round_trip == raw} ({len(raw)} raw bytes, {len(round_trip)} re-serialised): spliced as text", ""]
    model = difficulty.load_model()
    items = {row["id"]: row for row in before["items"]}
    faults: list[str] = []
    for item_id in SEVEN:
        row = items[item_id]
        new_path = W / "content" / "scores" / "pdmx" / f"{row['cid']}.mxl"
        if row["convertedSha256"] == hashlib.sha256(new_path.read_bytes()).hexdigest():
            # Idempotent: a row already naming the file in place was spliced by an earlier run; it is left as it is.
            lines.append(f"== {item_id}: already spliced (convertedSha256 is the file in place); left as it is")
            continue
        with tempfile.TemporaryDirectory() as tmp:
            old_path = Path(tmp) / f"{row['cid']}.mxl"
            old_path.write_bytes(subprocess.run(["git", "-C", str(W), "show", f"{base}:content/scores/pdmx/{row['cid']}.mxl"],
                                                capture_output=True, check=True).stdout)
            old_features, old_level, old_drivers = measure(old_path, model)
        new_features, new_level, new_drivers = measure(new_path, model)
        new_sha = hashlib.sha256(new_path.read_bytes()).hexdigest()
        stored = row["features"]
        if old_features != stored:
            faults.append(f"{item_id}: the committed code on the committed file does not give the stored features: "
                          f"{ {k: (stored.get(k), v) for k, v in old_features.items() if stored.get(k) != v} }")
        moved = {k for k in new_features if new_features[k] != stored.get(k)}
        if moved - {"notesPerSecond"}:
            faults.append(f"{item_id}: features other than notesPerSecond moved: {sorted(moved - {'notesPerSecond'})}")
        bands = []
        for name, band in rungs_of(item_id):
            inside = band is None or float(band[0]) - 1e-9 <= new_level <= float(band[1]) + 1e-9
            bands.append(f"{name} band {band}: {'in' if inside else 'OUT'}")
        lines.append(f"== {item_id}")
        lines.append(f"   level: stored {row['level']} (levelFrom {row['levelFrom']}); committed code on the committed file {old_level} "
                     f"(drivers {old_drivers}); committed code on the new file {new_level} (drivers {new_drivers})")
        lines.append(f"   notesPerSecond: stored {stored['notesPerSecond']}, committed file {old_features['notesPerSecond']}, new file {new_features['notesPerSecond']}; "
                     f"other eighteen features equal: {not (moved - {'notesPerSecond'})}")
        lines.append(f"   rungs: {bands if bands else 'none'}")
        # the splice, inside the row's block
        start = text.index(f'"id": "{item_id}"')
        end = text.index('\n    }', start)
        block = text[start:end]
        with zipfile.ZipFile(new_path) as archive:
            names = [n for n in archive.namelist() if not n.upper().startswith("META-INF/")]
            xml = archive.read(names[0]).decode("utf-8")
        sounds = [float(t) for t in re.findall(r'<sound tempo="([0-9.]+)"', xml)]
        if len(sounds) != 1:
            faults.append(f"{item_id}: {len(sounds)} <sound tempo> in the new file")
        tempo_bpm = sounds[0]
        drivers = json.dumps(new_drivers, indent=2).replace("\n", "\n      ")
        block = one(r'"convertedSha256": "([0-9a-f]{64})"', block, new_sha, "convertedSha256")
        block = one(r'"tempoBpm": ([0-9.]+)', block, json.dumps(tempo_bpm), "tempoBpm")
        block = one(r'"tempoDefaulted": (true|false)', block, "false", "tempoDefaulted")
        block = one(r'"notesPerSecond": ([0-9.eE+-]+)', block, json.dumps(new_features["notesPerSecond"]), "notesPerSecond")
        block = one(r'\n      "level": ([0-9.]+),', block, json.dumps(new_level), "level")
        block = one(r'"levelFrom": "([^"]*)"', block, LEVEL_FROM, "levelFrom")
        block = one(r'"levelDrivers": (\[.*?\n      \])', block, drivers, "levelDrivers")
        text = text[:start] + block + text[end:]
        lines.append(f"   spliced: convertedSha256 {row['convertedSha256'][:12]}… -> {new_sha[:12]}…, tempoBpm {row['tempoBpm']} -> {tempo_bpm}, "
                     f"tempoDefaulted {str(row['tempoDefaulted']).lower()} -> false, level {row['level']} -> {new_level}, levelFrom {row['levelFrom']} -> {LEVEL_FROM}")
        lines.append("")
    after = json.loads(text)
    for old_row, new_row in zip(before["items"], after["items"]):
        if old_row == new_row:
            continue
        if old_row["id"] not in SEVEN:
            faults.append(f"{old_row['id']}: a row outside the seven moved")
            continue
        moved = {k for k in set(old_row) | set(new_row) if old_row.get(k) != new_row.get(k)}
        if moved - CHANGED:
            faults.append(f"{old_row['id']}: fields outside the splice moved: {sorted(moved - CHANGED)}")
        features_moved = {k for k in old_row["features"] if old_row["features"][k] != new_row["features"][k]}
        if features_moved - {"notesPerSecond"}:
            faults.append(f"{old_row['id']}: features other than notesPerSecond moved")
        if json.dumps(old_row["review"]) != json.dumps(new_row["review"]):
            faults.append(f"{old_row['id']}: the review object moved")
    if len(before["items"]) != len(after["items"]) or {k: v for k, v in before.items() if k != "items"} != {k: v for k, v in after.items() if k != "items"}:
        faults.append("the table's other keys or its row count moved")
    changed_rows = sum(1 for a, b in zip(before["items"], after["items"]) if a != b)
    lines.append(f"parsed comparison: {changed_rows} rows moved, each only in {sorted(CHANGED)} (features: notesPerSecond only); review objects byte-identical")
    lines.append(f"{len(faults)} fault(s)")
    lines += [f"   {fault}" for fault in faults]
    if not faults:
        TABLE.write_bytes(text.encode("utf-8"))
        lines.append(f"written: {TABLE.relative_to(W).as_posix()}")
    # A rerun that spliced nothing prints and keeps the record the splicing run wrote.
    if any("   spliced:" in line for line in lines):
        LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
