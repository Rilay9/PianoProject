"""
Measures candidate public-domain tunes for 2.4's tie against independent PDMX editions (the owner's archive).

For each candidate title: rows the dataset marks public domain or CC0, one or two tracks, at most 80 bars, up
to MAX_PER_TUNE (rated and deduplicated first). The tarball is streamed once for all of them. For each file:
the melody (the top staff's highest line, chords reduced to their top note) — bars, metre, key, range, ties
(a tie chain counted once), and how many of those ties start on a beat; and the ties on every staff.

The question it answers: does the tune's own notation hold notes across bar lines or beats, in edition after
edition — so the ties are the tune's, not an arranger's — and at what rate per bar.

    python scripts-pdmx-tie-tunes.py <PDMX dir> <scratch dir>
"""
import csv
import json
import statistics
import sys
import tarfile
from fractions import Fraction
from pathlib import Path

import warnings

warnings.filterwarnings("ignore")
from music21 import converter, stream  # noqa: E402

TUNES = {
    "auld lang syne": ["auld lang syne"],
    "silent night": ["silent night", "stille nacht"],
    "amazing grace": ["amazing grace"],
    "down in the valley": ["down in the valley"],
    "shenandoah": ["shenandoah"],
    "home on the range": ["home on the range"],
    "scarborough fair": ["scarborough fair"],
    "the water is wide": ["water is wide"],
    "kumbaya": ["kumbaya", "kum ba yah"],
    "cielito lindo": ["cielito lindo"],
    "red river valley": ["red river valley"],
    "aura lee": ["aura lee"],
    "loch lomond": ["loch lomond"],
    "my bonnie": ["my bonnie"],
    "oh susanna": ["oh susanna", "oh! susanna"],
    "clementine": ["clementine"],
    "skye boat song": ["skye boat song"],
    "drink to me only": ["drink to me only"],
    "long long ago": ["long, long ago", "long long ago"],
    "londonderry air": ["londonderry air", "danny boy"],
    "swing low": ["swing low"],
    "simple gifts": ["simple gifts"],
    "beautiful dreamer": ["beautiful dreamer"],
    "sakura": ["sakura"],
    "molly malone": ["molly malone"],
    "morning has broken": ["morning has broken", "bunessan"],
    "early one morning": ["early one morning"],
    "we wish you a merry christmas": ["we wish you a merry christmas"],
    "o come all ye faithful": ["o come all ye faithful", "adeste fideles"],
    "away in a manger": ["away in a manger"],
}
MAX_PER_TUNE = 6
MAX_BARS = 80

pdmx_dir, scratch = Path(sys.argv[1]), Path(sys.argv[2])
scratch.mkdir(parents=True, exist_ok=True)
csv.field_size_limit(10_000_000)


def as_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


picked = {tune: [] for tune in TUNES}
with (pdmx_dir / "PDMX.csv").open("r", encoding="utf-8", newline="") as handle:
    for row in csv.DictReader(handle):
        if row.get("license") not in ("publicdomain", "cc-zero"):
            continue
        tracks = as_float(row.get("n_tracks"))
        bars = as_float(row.get("song_length.bars"))
        if tracks is None or tracks > 2 or bars is None or bars > MAX_BARS:
            continue
        name = f"{row.get('song_name', '')} {row.get('title', '')}".lower()
        for tune, needles in TUNES.items():
            if any(n in name for n in needles):
                picked[tune].append(row)
                break

members = {}
for tune, rows in picked.items():
    rows.sort(key=lambda r: (r.get("is_rated") != "True", r.get("subset:deduplicated") != "True", -(as_float(r.get("rating")) or 0)))
    picked[tune] = rows[:MAX_PER_TUNE]
    for row in picked[tune]:
        member = row["mxl"].replace("\\", "/").lstrip("./")
        members[member] = scratch / Path(member).name

wanted = {m for m, p in members.items() if not p.exists()}
if wanted:
    with tarfile.open(pdmx_dir / "mxl.tar.gz", mode="r|gz") as tar:
        for info in tar:
            name = info.name.lstrip("./")
            if name in wanted:
                data = tar.extractfile(info).read()
                members[name].write_bytes(data)
                wanted.discard(name)
                if not wanted:
                    break
print(f"extracted; {len(wanted)} member(s) not found")


def melody_line(score):
    parts = list(score.parts)
    if not parts:
        return None
    top = parts[0]
    # A piano part carrying two staves arrives as two PartStaff objects; parts[0] is the upper.
    notes = []
    for n in top.recurse().notes:
        if n.duration.isGrace:
            continue
        pitch = max(n.pitches, key=lambda p: p.ps) if n.isChord else n.pitch
        notes.append((n.getOffsetInHierarchy(top), n, pitch))
    # the highest line: at each onset, the highest note
    by_onset = {}
    for off, n, p in notes:
        if off not in by_onset or p.ps > by_onset[off][1].ps:
            by_onset[off] = (n, p)
    return top, [(off, n, p) for off, (n, p) in sorted(by_onset.items())]


def tie_facts(score):
    top, line = melody_line(score)
    ts = next(iter(score.recurse().getElementsByClass("TimeSignature")), None)
    beat = Fraction(ts.beatDuration.quarterLength).limit_denominator(16) if ts else Fraction(1)
    measures = top.getElementsByClass(stream.Measure)
    bars = len(measures) or 1
    starts = 0
    on_beat = 0
    for off, n, p in line:
        tie = n.tie
        if tie is not None and tie.type == "start":
            starts += 1
            m = n.getContextByClass(stream.Measure)
            within = Fraction(n.offset).limit_denominator(48)
            if m is not None and within % beat == 0:
                on_beat += 1
    all_ties = sum(1 for n in score.recurse().notes if n.tie is not None and n.tie.type == "start")
    keys = [k for k in score.recurse().getElementsByClass("KeySignature")]
    pitches = [p.ps for _o, _n, p in line]
    return {
        "bars": bars, "metre": ts.ratioString if ts else None, "fifths": keys[0].sharps if keys else None,
        "melodyTies": starts, "onBeat": on_beat, "perBar": round(starts / bars, 2), "allStaffTies": all_ties,
        "range": [min(pitches), max(pitches)] if pitches else None,
    }


summary = {}
for tune, rows in picked.items():
    print(f"== {tune}: {len(rows)} edition(s)")
    rates = []
    for row in rows:
        member = row["mxl"].replace("\\", "/").lstrip("./")
        path = members[member]
        if not path.exists():
            print("   missing", member)
            continue
        try:
            facts = tie_facts(converter.parse(str(path)))
        except Exception as exc:  # noqa: BLE001
            print(f"   {path.stem[:14]} parse failed: {type(exc).__name__}")
            continue
        rates.append(facts["perBar"])
        print(f"   {path.stem[:14]} {row.get('license'):12} rated={row.get('is_rated')} '{(row.get('title') or '')[:48]}' {json.dumps(facts)}")
    if rates:
        summary[tune] = {"editions": len(rates), "medianMelodyTiesPerBar": statistics.median(rates),
                         "editionsAtOrAbove0.2": sum(1 for r in rates if r >= 0.2)}
print("\n== summary (melody ties per bar across editions; the claim rule wants 4 or more and 0.2 per bar)")
for tune, s in sorted(summary.items(), key=lambda kv: -kv[1]["medianMelodyTiesPerBar"]):
    print(f"   {tune:32} {s}")
