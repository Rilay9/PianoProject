"""
X31's corpus table (item 4): the build's opening tempo, before and after X31 (`scripts-corpus-bpm.py`, music21),
beside the app's (`scripts-corpus-app.test.ts`, the app's one tempo reader; the model opens at 100 where it reads
no opening), and X3d's 179 moved openings (`runs/X3d/corpus-models.txt`, the Score label before → after at 100 %).

"Equal" is to a hundredth, X3d's comparison. Each differing score is given the form that explains it, read off
the two probes' fields; a score no rule explains is listed as "other" for a person to read.

    python docs/prompts/runs/X31/scripts-corpus-table.py <corpus-bpm.jsonl> <corpus-app.jsonl> <x3d corpus-models.txt>
"""
from __future__ import annotations

import json
import math
import re
import sys
from collections import Counter
from pathlib import Path

FORMS = {
    "late-tempo": "the file's first tempo stands after notes have sounded: the app opens at its default 100 until it, "
                  "the build takes the earliest mark anywhere (X3d's opening rule, not copied into Python)",
    "mark-over-sound": "a mark and a <sound tempo> at the opening disagree (in one direction, or side by side): "
                       "music21 keeps the mark, the app the sound",
    "dropped-sound": "the app's opening <sound tempo> stands in a direction whose <metronome> music21 cannot read: "
                     "music21 drops the sound with the mark and takes another tempo at the same place",
    "no-number": "music21 reads no tempo at the opening where the app reads one (a number music21 cannot read, "
                 "or a <sound tempo> music21 drops beside an unreadable <metronome>)",
    "other": "not explained by the three forms: read by hand",
}


def label(bpm: float) -> int:
    """The Score label's rounding (JavaScript's Math.round), not Python's round-half-even."""
    return math.floor(bpm + 0.5)


def form_of(build_row: dict, app: dict) -> str:
    build = build_row["after"]
    from_sound = (build_row.get("opening") or {}).get("numberSounding") is not None
    opening = app.get("opening")
    if opening is None:
        return "late-tempo" if abs(build - 100.0) >= 0.01 else "other"
    mark = app.get("mark")
    if app.get("from") == "sound" and mark and not from_sound and abs(mark.get("quarters", -1) - build) < 0.01:
        return "mark-over-sound"
    if app.get("from") == "sound" and mark and from_sound:
        return "dropped-sound"
    if abs(build - 100.0) < 0.01:
        return "no-number"
    return "other"


def main() -> int:
    build_rows = {}
    for line in Path(sys.argv[1]).read_text(encoding="utf-8").splitlines():
        if line.strip():
            row = json.loads(line)
            build_rows[row["id"]] = row
    app_rows = {}
    for line in Path(sys.argv[2]).read_text(encoding="utf-8").splitlines():
        if line.strip():
            row = json.loads(line)
            app_rows[row["id"]] = row
    moved: dict[str, tuple[int, int, str]] = {}
    for line in Path(sys.argv[3]).read_text(encoding="utf-8").splitlines():
        found = re.match(r"^(\S+)\t(\d+) → (\d+) bpm\tcatalogue (\S+)", line)
        if found:
            moved[found.group(1)] = (int(found.group(2)), int(found.group(3)), found.group(4))

    ids = sorted(set(build_rows) & set(app_rows))
    errors = sorted(i for i in ids if "error" in build_rows[i] or "error" in app_rows[i])
    compared = [i for i in ids if i not in errors]
    equal_after, equal_before, differ = [], [], []
    for item in compared:
        b, a = build_rows[item], app_rows[item]
        app = a["opening"] if a["opening"] is not None else 100.0
        if abs(b["before"] - app) < 0.01:
            equal_before.append(item)
        if abs(b["after"] - app) < 0.01:
            equal_after.append(item)
        else:
            differ.append(item)

    out: list[str] = []
    out.append(f"scores the built catalogue names with a MusicXML file: {len(ids)} (build probe {len(build_rows)}, app probe {len(app_rows)}); unreadable on either side: {len(errors)}")
    out.append(f"compared: {len(compared)}")
    out.append(f"the build's opening equals the app's (to a hundredth): before X31 {len(equal_before)}; after X31 {len(equal_after)}")
    out.append(f"differing after X31: {len(differ)}")
    forms = Counter(form_of(build_rows[i], app_rows[i]) for i in differ)
    for key in FORMS:
        out.append(f"  {key}: {forms.get(key, 0)} — {FORMS[key]}")
    changed = [i for i in compared if abs(build_rows[i]["before"] - build_rows[i]["after"]) >= 0.01]
    out.append(f"the build's opening moved by X31 (before != after): {len(changed)}; of them now equal to the app's: "
               f"{sum(1 for i in changed if i in set(equal_after))}; equal before and not after: "
               f"{sum(1 for i in changed if i in set(equal_before) and i not in set(equal_after))}")
    not_first = [i for i in compared if build_rows[i].get("openingIsFirstFound") is False]
    out.append(f"scores whose opening is not the first mark recurse() meets: {len(not_first)}")
    implicit = [i for i in compared if build_rows[i].get("implicitMarks")]
    out.append(f"scores with a mark whose number music21 took from a tempo word (not a tempo now): {len(implicit)}")

    # X3d's 179 first.
    out.append("")
    in_moved = [i for i in moved if i in build_rows and i in app_rows]
    agree_label = [i for i in in_moved if label(build_rows[i]["after"]) == moved[i][1]]
    agree_exact = [i for i in in_moved if i in set(equal_after)]
    before_label = [i for i in in_moved if label(build_rows[i]["before"]) == moved[i][1]]
    out.append(f"X3d's moved openings: {len(moved)} listed; found in both probes: {len(in_moved)}")
    out.append(f"  the build's opening, as the label rounds, equals the app's label after X3d: before X31 {len(before_label)}; after X31 {len(agree_label)}")
    out.append(f"  the build's opening equals the app's reader to a hundredth, after X31: {len(agree_exact)}")
    out.append("  of the 179, differing after X31 (id, build before → after, app label before → after, the app's reader, the catalogue, form):")
    for item in sorted(in_moved):
        if item in set(equal_after):
            continue
        b, a = build_rows[item], app_rows[item]
        before_label_app, after_label_app, catalogue = moved[item]
        app = a["opening"] if a["opening"] is not None else 100.0
        out.append(f"  {item}\t{b['before']:g} → {b['after']:g}\tlabel {before_label_app} → {after_label_app}\treader {app:g}"
                   f"\tcatalogue {catalogue}\t{form_of(b, a)}")

    # Every differing score, by form.
    for key in FORMS:
        rows = [i for i in differ if form_of(build_rows[i], app_rows[i]) == key]
        if not rows:
            continue
        out.append("")
        out.append(f"== {key} ({len(rows)}): {FORMS[key]}")
        out.append("id\tbuild before\tbuild after\tapp opening\tapp from\tapp mark at the opening\tapp first event\tcatalogue tempoBpm\tin X3d's 179")
        for item in rows:
            b, a = build_rows[item], app_rows[item]
            mark = a.get("mark")
            mark_text = f"{mark['beatUnit']}{'.' * mark['dots']} = {mark['perMinute']:g} ({mark['quarters']:g} quarters)" if mark else "-"
            first = a.get("first")
            first_text = f"bar ordinal {first['measure']} +{first['offset']:g}: {first['bpm']:g} ({first['from']})" if first else "-"
            app_text = f"{a['opening']:g}" if a["opening"] is not None else "100 (default)"
            out.append(f"{item}\t{b['before']:g}\t{b['after']:g}\t{app_text}\t{a.get('from') or '-'}\t{mark_text}\t{first_text}"
                       f"\t{b['catalogue'].get('tempoBpm')}\t{'yes' if item in moved else 'no'}")

    if errors:
        out.append("")
        out.append("unreadable:")
        for item in errors:
            out.append(f"{item}\t{build_rows[item].get('error', '')}\t{app_rows[item].get('error', '')}")
    print("\n".join(out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
