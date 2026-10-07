"""PH1's independent witness (brief test 7): music21 places every chord symbol and measures every bar of every
file the census read, and both are compared with the new reader's (census.table.ts's per-file rows).

    python music21_witness.py <census rows .jsonl> <main checkout> <worktree> <out .txt> [workers]

For every file with a chord symbol the reader names:

* symbols: music21's in-measure offset (`getOffsetInHierarchy(measure)`) and root pitch class of every
  `harmony.ChordSymbol` (a `NoChord` counted apart: the reader skips a symbol with no root), grouped by measure
  number (music21's `Measure.number`, the reader's parseInt of the `number` attribute), matched to the reader's by
  root and offset (tolerance 1e-4); what is left is paired by root (an offset disagreement) or listed as read by
  one reader only;
* bars (the part the reader takes its bars from): the notated length (the furthest a note or rest reaches,
  harmony excluded) against the reader's walked length, and the pickup reading (music21's `paddingLeft` > 0)
  against the reader's `pickup` / first-bar `incomplete` status.

Paths in the output are corpus labels (content/..., bundle/..., fixtures/...), never machine paths.
"""

from __future__ import annotations

import json
import sys
import warnings
from collections import defaultdict
from multiprocessing import Pool
from pathlib import Path

TOL = 1e-4


def resolve(label: str, main: Path, worktree: Path) -> Path:
    head, _, rest = label.partition("/")
    if head == "content":
        return main / "content" / "scores" / rest
    if head == "bundle":
        return main / "app" / "public" / "content" / "scores" / rest
    if head == "quarry":
        return worktree / "docs" / "review" / "pdmx-quarry-2026-10-05" / "xml" / rest
    if head == "fixtures":
        return worktree / "app" / "tests" / "fixtures" / "scores" / rest
    raise ValueError(f"unknown corpus label {label}")


def witness(job: tuple[dict, str, str]) -> dict:
    row, main, worktree = job
    warnings.simplefilter("ignore")
    from music21 import converter, harmony  # noqa: PLC0415

    label = row["paths"][0]
    path = resolve(label, Path(main), Path(worktree))
    out: dict = {"label": label, "paths": row["paths"]}
    try:
        score = converter.parse(str(path), forceSource=True)
    except Exception as cause:  # noqa: BLE001
        out["error"] = f"{type(cause).__name__}: {cause}"[:300]
        return out
    # music21 splits a multi-staff <part> into PartStaffs ("P1-Staff1", "P1-Staff2"): group them back into the
    # file's parts, so part ordinals line up with the reader's (parts in page order).
    groups: list[list] = []
    previous_base = None
    from music21 import stream  # noqa: PLC0415

    for part in score.parts:
        base = str(part.id).split("-Staff")[0] if isinstance(part, stream.PartStaff) else None
        if base is not None and base == previous_base and groups:
            groups[-1].append(part)
        else:
            groups.append([part])
        previous_base = base

    # (offset, root pc, figure, part group, staff within the group)
    m21: dict[int, list[tuple[float, int | None, str, int, int]]] = defaultdict(list)
    nochords = 0
    for group_index, group in enumerate(groups):
        for staff_index, part in enumerate(group):
            for measure in part.getElementsByClass("Measure"):
                for cs in measure.recurse().getElementsByClass(harmony.ChordSymbol):
                    if isinstance(cs, harmony.NoChord):
                        nochords += 1
                        continue
                    root = cs.root()
                    m21[int(measure.number)].append(
                        (float(cs.getOffsetInHierarchy(measure)), root.pitchClass if root is not None else None, cs.figure, group_index, staff_index)
                    )
    # (offset, root pc, text, staff, part); a measure number that is not a number (NaN, written null) keys as None.
    ours: dict[int | None, list[tuple[float, int, str, str, int]]] = defaultdict(list)
    for number, offset, root, text, staff, part in row["symbols"]:
        ours[int(number) if number is not None else None].append((float(offset), int(root), text, staff, int(part)))
    staffless = {(n, round(s[0], 4), s[1], s[4]) for n, items in ours.items() for s in items if s[3] == ""}

    agree = 0
    offset_disagree: list[str] = []
    ours_only: list[str] = []
    m21_only: list[str] = []
    m21_copies: list[str] = []
    unnumbered: list[str] = []
    leftovers_m21: list[tuple[int, tuple]] = []
    for number in sorted({n for n in set(ours) | set(m21) if n is not None}):
        left = list(ours.get(number, []))
        right = list(m21.get(number, []))
        for item in list(left):
            match = next((r for r in right if r[1] == item[1] and abs(r[0] - item[0]) <= TOL), None)
            if match is not None:
                agree += 1
                left.remove(item)
                right.remove(match)
        for item in list(left):
            candidates = [r for r in right if r[1] == item[1]]
            if candidates:
                best = min(candidates, key=lambda r: abs(r[0] - item[0]))
                offset_disagree.append(f"bar {number}: {item[2]} reader {item[0]:g}, music21 {best[0]:g}")
                left.remove(item)
                right.remove(best)
        ours_only += [f"bar {number}: {item[2]} @{item[0]:g}" for item in left]
        for r in right:
            # music21 copies a harmony with no <staff> into every staff of a multi-staff part.
            if len(groups[r[3]]) > 1 and r[4] > 0 and (number, round(r[0], 4), r[1], r[3]) in staffless:
                m21_copies.append(f"bar {number}: {r[2]} @{r[0]:g}")
            else:
                leftovers_m21.append((number, r))
    # A reader symbol in a measure whose number is not a number: paired with music21's by root and offset.
    for item in ours.get(None, []):
        pair = next((x for x in leftovers_m21 if x[1][1] == item[1] and abs(x[1][0] - item[0]) <= TOL), None)
        if pair is not None:
            leftovers_m21.remove(pair)
            unnumbered.append(f"{item[2]} @{item[0]:g}: the reader's measure number is not a number (music21 numbers it {pair[0]})")
        else:
            ours_only.append(f"bar (number not a number): {item[2]} @{item[0]:g}")
    m21_only += [f"bar {n}: {r[2]} @{r[0]:g} (root pc {r[1]})" for n, r in leftovers_m21]
    out.update(
        symbols=len(row["symbols"]),
        agree=agree,
        offset_disagree=offset_disagree,
        ours_only=ours_only,
        m21_only=m21_only,
        m21_copies=m21_copies,
        unnumbered=unnumbered,
        nochords=nochords,
    )

    # Bars of the reader's harmony part: every staff of the music21 part group, the furthest any reaches.
    part_index = min(row["harmonyParts"]) if row["harmonyParts"] else 0
    bar_agree = 0
    bar_disagree: list[str] = []
    pickup_agree = 0
    pickup_disagree: list[str] = []
    pickup_explained: list[str] = []
    # music21's own pickup rule, replayed on the reader's walked and nominal lengths (xmlToM21.py,
    # PartParser.adjustTimeAttributesFromMeasure): the first bar is padded when short; later, a short bar sets
    # lastMeasureWasShort, which only a full-length or overfull bar leaves standing, and the next short bar while it
    # stands is padded as an anacrusis (and clears it); a bar with nothing in it clears it.
    emulated: list[bool] = []
    last_short = False
    for i, (_o, _n, walked, nominal, _imp, _st, _len) in enumerate(row["measures"]):
        if nominal is None:
            emulated.append(False)
        elif i == 0:
            emulated.append(TOL < walked < nominal - TOL)
        elif walked >= nominal - TOL:
            emulated.append(False)
        elif walked <= TOL:
            emulated.append(False)
            last_short = False
        elif last_short:
            emulated.append(True)
            last_short = False
        else:
            emulated.append(False)
            last_short = True
    if part_index < len(groups):
        staves = [list(p.getElementsByClass("Measure")) for p in groups[part_index]]
        measures = staves[0]
        if any(len(s) != len(row["measures"]) for s in staves):
            bar_disagree.append(f"measure count: reader {len(row['measures'])}, music21 {[len(s) for s in staves]}")
        for i, (ordinal, number, walked, nominal, implicit, status, length) in enumerate(row["measures"]):
            if i >= len(measures):
                break
            reach = 0.0
            for staff in staves:
                if i >= len(staff):
                    continue
                for element in staff[i].recurse().notesAndRests:
                    if isinstance(element, harmony.Harmony):
                        continue
                    reach = max(reach, float(element.getOffsetInHierarchy(staff[i])) + float(element.quarterLength))
            if abs(reach - walked) <= TOL:
                bar_agree += 1
            elif walked == 0 and nominal is not None and abs(reach - nominal) <= TOL:
                # music21 fills a bar with nothing in it with a bar's rest (its PDFtoMusic repair); the reader calls
                # it empty and gives it the metre's length: the same bar.
                bar_agree += 1
            else:
                bar_disagree.append(
                    f"ordinal {ordinal} (number {number}): reader walked {walked:g} ({status}), music21 notated {reach:g}"
                )
            padding = float(measures[i].paddingLeft or 0)
            m21_pickup = padding > 0
            reader_pickup = status == "pickup" or (status == "incomplete" and ordinal == 0)
            if m21_pickup == reader_pickup:
                pickup_agree += 1
                continue
            if m21_pickup == emulated[i]:
                pickup_explained.append(
                    f"ordinal {ordinal} (number {number}): reader {status} (walked {walked:g} of {nominal}), music21 paddingLeft {padding:g}: "
                    f"music21's carried short-bar rule (a short bar after an earlier unpadded short bar is padded as an anacrusis)"
                )
            else:
                pickup_disagree.append(f"ordinal {ordinal} (number {number}): reader {status}, music21 paddingLeft {padding:g}")
    else:
        bar_disagree.append(f"music21 has {len(groups)} part groups; the reader's harmony part is {part_index}")
    out.update(
        bar_agree=bar_agree,
        bar_disagree=bar_disagree,
        pickup_agree=pickup_agree,
        pickup_disagree=pickup_disagree,
        pickup_explained=pickup_explained,
    )
    return out


def main() -> None:
    rows_path, main_dir, worktree, out_path = sys.argv[1:5]
    workers = int(sys.argv[5]) if len(sys.argv) > 5 else 2
    rows = [json.loads(line) for line in Path(rows_path).read_text(encoding="utf-8-sig").splitlines() if line.strip()]
    with Pool(workers) as pool:
        results = pool.map(witness, [(row, main_dir, worktree) for row in rows], chunksize=4)
    Path(out_path + ".json").write_text(json.dumps(results, ensure_ascii=False, indent=0), encoding="utf-8")

    def total(key: str) -> int:
        return sum(r.get(key, 0) if isinstance(r.get(key, 0), int) else len(r.get(key, [])) for r in results)

    lines = [
        "# PH1: music21 as the independent witness to the new reader",
        "",
        f"files read: {len(results)}; music21 could not parse: {sum(1 for r in results if 'error' in r)}",
        f"symbols (reader): {total('symbols')}; agree (same bar, root, offset within {TOL}): {total('agree')}",
        f"offset disagreements (same bar and root, different offset): {total('offset_disagree')}",
        f"explained, not disagreements: music21's copies of a staffless harmony into the other staves of its part: {total('m21_copies')}; "
        f"symbols in a measure whose number is not a number, paired by root and offset: {total('unnumbered')}",
        f"unexplained: read by the reader only {total('ours_only')}; by music21 only {total('m21_only')}",
        f"music21 NoChord symbols (no root; the reader skips a rootless symbol, as before PH1): {total('nochords')}",
        f"bars (reader's harmony part, every staff): notated length agrees {total('bar_agree')}, differs {total('bar_disagree')}",
        f"pickup reading (reader pickup / first-bar incomplete against music21 paddingLeft > 0): agrees {total('pickup_agree')}; "
        f"differs, explained (music21's carried short-bar rule, replayed on the reader's lengths) {total('pickup_explained')}; differs, unexplained {total('pickup_disagree')}",
        "",
    ]
    for key, title in [
        ("error", "music21 could not parse"),
        ("offset_disagree", "Offset disagreements"),
        ("ours_only", "Read by the reader only (unexplained)"),
        ("m21_only", "Read by music21 only (unexplained)"),
        ("unnumbered", "Symbols in a measure whose number is not a number"),
        ("bar_disagree", "Notated bar length disagreements"),
        ("pickup_disagree", "Pickup reading disagreements (unexplained)"),
        ("pickup_explained", "Pickup reading disagreements explained by music21's carried short-bar rule"),
    ]:
        lines.append(f"## {title}")
        for r in results:
            value = r.get(key)
            if not value:
                continue
            if isinstance(value, str):
                lines.append(f"{' = '.join(r['paths'])}: {value}")
            else:
                lines.append(" = ".join(r["paths"]))
                lines += [f"  {item}" for item in value]
        lines.append("")
    ids = ("QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6", "QmemwmomPM2tq51u1sTFEAPqdzPkwrJkuKCsMThnKqpvFW")
    a7b1 = [r for r in results if any(k in r["label"] for k in ids)]
    lines.append(f"## The A7b.1 charts (the committed files and the raw quarry dumps): {len(a7b1)} files")
    for r in a7b1:
        lines.append(
            f"  {' = '.join(r['paths'])}: symbols {r.get('symbols')}, agree {r.get('agree')}, offset disagreements {len(r.get('offset_disagree', []))}, "
            f"reader only {len(r.get('ours_only', []))}, music21 only {len(r.get('m21_only', []))}, music21 copies {len(r.get('m21_copies', []))}, "
            f"bars agree {r.get('bar_agree')}, differ {len(r.get('bar_disagree', []))}"
        )
    Path(out_path).write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
