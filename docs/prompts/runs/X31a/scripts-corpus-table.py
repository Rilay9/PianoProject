"""
X31a's corpus table (X31's `scripts-corpus-table.py`, X31a's columns): the build's opening tempo as X31 shipped it
and as X31a reads it (`scripts-corpus-bpm.py`, music21), beside the app's (`scripts-corpus-app.test.ts`, the app's
one tempo reader; the model opens at 100 where it reads no opening), and X3d's 179 moved openings
(`runs/X3d/corpus-models.txt`, the Score label before → after at 100 %).

"Equal" is to a hundredth, X3d's comparison. Each differing score is given the form that explains it, read off
the two probes' fields; a score no rule explains is listed as "other" for a person to read.

    python docs/prompts/runs/X31a/scripts-corpus-table.py <corpus-bpm.jsonl> <corpus-app.jsonl> <x3d corpus-models.txt>
"""
from __future__ import annotations

import json
import math
import re
import sys
from collections import Counter
from pathlib import Path

FORMS = {
    "late-tempo": "the app opens at its default 100 (a note sounds before the file's first tempo); the build opens "
                  "at a mark",
    "sound-before-mark": "the app opens at a tempo; music21 has a note beginning before the build's first mark, so "
                         "the build opens at 100 (a <cue/> note music21 reads as a note, or a direction music21 "
                         "moves by an <offset> that does not sound)",
    "mark-over-sound": "a mark and a <sound tempo> at the opening disagree (in one direction, or side by side): "
                       "music21 keeps the mark, the app the sound",
    "dropped-sound": "the app's opening <sound tempo> stands in a direction whose <metronome> music21 cannot read: "
                     "music21 drops the sound with the mark and takes another tempo at the same place",
    "no-number": "music21 reads no tempo at the opening where the app reads one (a number music21 cannot read, "
                 "or a <sound tempo> music21 drops beside an unreadable <metronome>)",
    "other": "not explained by the forms above: read by hand",
}
NAMED = {
    "song.classical.bach-wtc1-prelude-2": "Bach, WTC I Prelude 2",
    "song.classical.leontovych-carol-of-the-bells-christmas-medley.pdmx": "Carol of the Bells medley",
    "song.pop.camille-le-festin-piano-arr-kno.pdmx": "Le Festin",
    "song.pop.misc-computer-games-fallout-4-trailer-soundtrack.pdmx": "Fallout 4 trailer",
}


def label(bpm: float) -> int:
    """The Score label's rounding (JavaScript's Math.round), not Python's round-half-even."""
    return math.floor(bpm + 0.5)


def app_value(app: dict) -> float:
    return app["opening"] if app["opening"] is not None else 100.0


def form_of(build_row: dict, app: dict) -> str:
    build = build_row["after"]
    opening = build_row.get("opening") or {}
    from_sound = opening.get("numberSounding") is not None
    if app.get("opening") is None:
        return "late-tempo" if abs(build - 100.0) >= 0.01 else "other"
    if abs(build - 100.0) < 0.01 and build_row.get("soundsBefore"):
        return "sound-before-mark"
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
    equal_x31 = {i for i in compared if abs(build_rows[i]["x31"] - app_value(app_rows[i])) < 0.01}
    equal_after = {i for i in compared if abs(build_rows[i]["after"] - app_value(app_rows[i])) < 0.01}
    differ = [i for i in compared if i not in equal_after]

    out: list[str] = []
    out.append(f"scores the built catalogue names with a MusicXML file: {len(ids)} (build probe {len(build_rows)}, app probe {len(app_rows)}); unreadable on either side: {len(errors)}")
    out.append(f"compared: {len(compared)}")
    out.append(f"the build's opening equals the app's (to a hundredth): as X31 shipped it {len(equal_x31)}; after X31a {len(equal_after)}")
    out.append(f"differing after X31a: {len(differ)}")
    forms = Counter(form_of(build_rows[i], app_rows[i]) for i in differ)
    for key in FORMS:
        out.append(f"  {key}: {forms.get(key, 0)} — {FORMS[key]}")
    changed = [i for i in compared if abs(build_rows[i]["x31"] - build_rows[i]["after"]) >= 0.01]
    out.append(f"the build's opening moved by X31a (X31's != X31a's): {len(changed)}; of them now equal to the app's: "
               f"{sum(1 for i in changed if i in equal_after)}; equal before and not after: "
               f"{sum(1 for i in changed if i in equal_x31 and i not in equal_after)}")
    late = [i for i in compared if build_rows[i].get("soundsBefore")]
    out.append(f"scores where a sounding note begins before the build's first readable mark: {len(late)}")
    grace_decides = [i for i in compared if build_rows[i].get("soundsBefore") != build_rows[i].get("nonGraceSoundsBefore")]
    out.append(f"scores where counting grace notes as sounding decides it (a grace note alone before the mark): {len(grace_decides)}"
               + (f" — {', '.join(grace_decides)}" if grace_decides else ""))

    out.append("")
    out.append("the four late-tempo files X31 named (id, the build as X31 shipped it → after X31a, the app's opening, equal now):")
    for item, name in NAMED.items():
        if item not in build_rows or item not in app_rows:
            out.append(f"  {name} ({item}): not in both probes")
            continue
        b, a = build_rows[item], app_rows[item]
        first = a.get("first")
        where = f"the app's first event at bar ordinal {first['measure']} +{first['offset']:g}" if first else "no event"
        out.append(f"  {name} ({item}): {b['x31']:g} → {b['after']:g}; app {app_value(a):g}; "
                   f"{'equal' if item in equal_after else 'DIFFERENT'}; the build's first mark at offset {(b.get('opening') or {}).get('offset')}, "
                   f"first sound at {b.get('firstSound')}; {where}")

    out.append("")
    out.append("every score whose build opening X31a moved (id, X31's → X31a's, the app's, equal now):")
    for item in sorted(changed):
        b, a = build_rows[item], app_rows[item]
        out.append(f"  {item}\t{b['x31']:g} → {b['after']:g}\tapp {app_value(a):g}\t{'equal' if item in equal_after else 'DIFFERENT (' + form_of(b, a) + ')'}")

    out.append("")
    in_moved = [i for i in moved if i in build_rows and i in app_rows]
    agree_label = [i for i in in_moved if "error" not in build_rows[i] and label(build_rows[i]["after"]) == moved[i][1]]
    agree_exact = [i for i in in_moved if i in equal_after]
    out.append(f"X3d's moved openings: {len(moved)} listed; found in both probes: {len(in_moved)}")
    out.append(f"  the build's opening, as the label rounds, equals the app's label after X3d, after X31a: {len(agree_label)}")
    out.append(f"  the build's opening equals the app's reader to a hundredth, after X31a: {len(agree_exact)}")
    for item in sorted(in_moved):
        if item in equal_after:
            continue
        b, a = build_rows[item], app_rows[item]
        out.append(f"  differing: {item}\t{b['x31']:g} → {b['after']:g}\treader {app_value(a):g}\t{form_of(b, a)}")

    for key in FORMS:
        rows = [i for i in differ if form_of(build_rows[i], app_rows[i]) == key]
        if not rows:
            continue
        out.append("")
        out.append(f"== {key} ({len(rows)}): {FORMS[key]}")
        out.append("id\tbuild X31\tbuild X31a\tapp opening\tapp from\tapp mark at the opening\tapp first event\tbuild first mark offset\tbuild first sound\tcatalogue tempoBpm\tin X3d's 179")
        for item in rows:
            b, a = build_rows[item], app_rows[item]
            mark = a.get("mark")
            mark_text = f"{mark['beatUnit']}{'.' * mark['dots']} = {mark['perMinute']:g} ({mark['quarters']:g} quarters)" if mark else "-"
            first = a.get("first")
            first_text = f"bar ordinal {first['measure']} +{first['offset']:g}: {first['bpm']:g} ({first['from']})" if first else "-"
            app_text = f"{a['opening']:g}" if a["opening"] is not None else "100 (default)"
            out.append(f"{item}\t{b['x31']:g}\t{b['after']:g}\t{app_text}\t{a.get('from') or '-'}\t{mark_text}\t{first_text}"
                       f"\t{(b.get('opening') or {}).get('offset')}\t{b.get('firstSound')}"
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
