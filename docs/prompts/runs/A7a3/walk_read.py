"""A7a.3 probe, Station 2: the walking-bass items read independently of the generator.

Reader: a raw MusicXML walk (ElementTree over the built .mxl's own XML; no music21 stream, no
generator code): per measure, the <harmony> root/kind, and every note with staff, pitch, onset and
duration. The theory oracle is music21's harmony.ChordSymbol built from the printed root and kind
only (its root, third and fifth pitch classes), never the generator's tables.

Per bar it checks the walking-bass contract stated in the record (H3):
  beat 1 root, beat 2 third (minor on a minor-seventh symbol, major on a dominant seventh),
  beat 3 fifth, beat 4 a semitone below the next bar's root; the closing bar root, third, fifth,
  octave; four quarter notes in the left hand; a right-hand chord held the whole bar.
And the form: the symbol sequence against TWELVE_BAR_MINOR (or TWELVE_BAR) plus a closing tonic bar.

Usage: py -3.11 walk_read.py <dir with built .mxl> <out.json> <id> [<id> ...]
"""
from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET
from fractions import Fraction
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "tools" / "content"))
from pdmx.quarry_core import mxl_inner_xml  # noqa: E402

STEP = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]
KIND_FIG = {"minor-seventh": "m7", "dominant": "7", "major-seventh": "maj7", "minor": "m", "major": ""}
# The forms as numerals (semitones above the tonic, quality), written here from the record's
# statement of them, for comparison only.
MINOR = [(0, "minor-seventh")] * 4 + [(5, "minor-seventh")] * 2 + [(0, "minor-seventh")] * 2 + \
        [(8, "dominant"), (7, "dominant"), (0, "minor-seventh"), (7, "dominant"), (0, "minor-seventh")]
MAJOR = [(0, "dominant")] * 4 + [(5, "dominant")] * 2 + [(0, "dominant")] * 2 + \
        [(7, "dominant"), (5, "dominant"), (0, "dominant"), (7, "dominant"), (0, "dominant")]


def midi(p: ET.Element) -> int:
    return 12 * (int(p.findtext("octave")) + 1) + STEP[p.findtext("step")] + int(float(p.findtext("alter") or 0))


def name(m: int) -> str:
    return f"{NAMES[m % 12]}{m // 12 - 1}"


def read(path: Path) -> list[dict]:
    root = ET.fromstring(mxl_inner_xml(path.read_bytes()))
    bars: dict[str, dict] = {}
    parts = list(root.iter("part"))
    for pi, part in enumerate(parts):
        div = 1
        for m in part.iter("measure"):
            b = bars.setdefault(m.get("number"), {"n": m.get("number"), "harm": [], "lh": [], "rh": [], "time": None})
            pos = Fraction(0)
            last_onset = Fraction(0)
            for el in m:
                if el.tag == "attributes":
                    if el.find("divisions") is not None:
                        div = int(el.findtext("divisions"))
                    if el.find("time") is not None:
                        b["time"] = f"{el.findtext('time/beats')}/{el.findtext('time/beat-type')}"
                elif el.tag == "harmony":
                    st = el.findtext("root/root-step")
                    al = int(float(el.findtext("root/root-alter") or 0))
                    b["harm"].append({"rootPc": (STEP[st] + al) % 12, "kind": el.findtext("kind"),
                                      "at": str(pos + Fraction(int(el.findtext("offset") or 0), div))})
                elif el.tag == "note":
                    if el.find("grace") is not None:
                        continue
                    d = Fraction(int(el.findtext("duration", "0")), div)
                    chord = el.find("chord") is not None
                    onset = last_onset if chord else pos
                    staff = el.findtext("staff") or str(pi + 1)
                    if el.find("rest") is None:
                        tgt = b["lh"] if staff == "2" else b["rh"]
                        tgt.append({"midi": midi(el.find("pitch")), "on": onset, "dur": d})
                    if not chord:
                        last_onset = pos
                        pos += d
                elif el.tag == "backup":
                    pos -= Fraction(int(el.findtext("duration", "0")), div)
                    last_onset = pos
                elif el.tag == "forward":
                    pos += Fraction(int(el.findtext("duration", "0")), div)
    return list(bars.values())


def chord_pcs(root_pc: int, kind: str) -> dict:
    from music21 import harmony
    cs = harmony.ChordSymbol(NAMES[root_pc].replace("b", "-") + KIND_FIG[kind])
    return {"root": cs.root().pitchClass, "third": cs.third.pitchClass, "fifth": cs.fifth.pitchClass,
            "figure": cs.figure}


def check(item: str, bars: list[dict]) -> dict:
    tonic = bars[0]["harm"][0]["rootPc"]
    form = MINOR if "minor" in item else MAJOR
    rows, problems = [], []
    for i, b in enumerate(bars):
        h = b["harm"]
        sym = h[0] if h else None
        lh = sorted(b["lh"], key=lambda n: n["on"])
        rh = b["rh"]
        row = {"bar": b["n"], "time": b["time"], "symbol": None, "lh": [f"{name(n['midi'])}:{n['dur']}" for n in lh],
               "rh": sorted({name(n["midi"]) for n in rh}), "rhDur": sorted({str(n["dur"]) for n in rh}),
               "roles": [], "approach": None, "notes": []}
        if len(h) != 1:
            problems.append(f"bar {b['n']}: {len(h)} symbols")
        if sym:
            c = chord_pcs(sym["rootPc"], sym["kind"])
            row["symbol"] = c["figure"]
            want = form[i] if i < len(form) else None
            got = ((sym["rootPc"] - tonic) % 12, sym["kind"])
            row["formOk"] = got == want
            if got != want:
                problems.append(f"bar {b['n']}: symbol {c['figure']} = {got}, form wants {want}")
            last = i == len(bars) - 1
            roles_want = ["root", "third", "fifth", "octave" if last else "approach"]
            for k, n in enumerate(lh):
                pc = n["midi"] % 12
                role = ("root" if pc == c["root"] else "third" if pc == c["third"] else
                        "fifth" if pc == c["fifth"] else "other")
                if k == 3 and last:
                    role = "octave" if n["midi"] - lh[0]["midi"] == 12 else role
                if k == 3 and not last:
                    nxt = bars[i + 1]["harm"][0]["rootPc"]
                    nxt_low = min(bars[i + 1]["lh"], key=lambda x: x["on"])["midi"]
                    row["approach"] = {"pcInterval": (nxt - pc) % 12, "toNextFirstNote": nxt_low - n["midi"]}
                    role = "approach" if (nxt - pc) % 12 == 1 and nxt_low - n["midi"] == 1 else f"other({(nxt - pc) % 12})"
                row["roles"].append(role)
            if row["roles"] != roles_want:
                problems.append(f"bar {b['n']}: roles {row['roles']} want {roles_want}")
            if [n["on"] for n in lh] != [0, 1, 2, 3] or any(n["dur"] != 1 for n in lh):
                problems.append(f"bar {b['n']}: lh rhythm {[(str(n['on']), str(n['dur'])) for n in lh]}")
            if not rh or any(n["dur"] != 4 or n["on"] != 0 for n in rh):
                problems.append(f"bar {b['n']}: rh not one chord held four beats")
            # the RH shell: root, third and seventh of the symbol?
            rpcs = {n["midi"] % 12 for n in rh}
            row["rhPcs"] = sorted(NAMES[p] for p in rpcs)
            row["lhRange"] = [name(min(n["midi"] for n in lh)), name(max(n["midi"] for n in lh))] if lh else None
        rows.append(row)
    if len(bars) != len(form):
        problems.append(f"{len(bars)} bars, the form plus closing bar is {len(form)}")
    allm = [n["midi"] for b in bars for n in b["lh"]]
    return {"item": item, "tonic": NAMES[tonic], "bars": len(bars), "rows": rows, "problems": problems,
            "lhSpan": [name(min(allm)), name(max(allm))]}


def main() -> int:
    src, out, ids = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3:]
    res = []
    for item in ids:
        r = check(item, read(src / f"{item}.mxl"))
        res.append(r)
        print(f"== {item}: tonic {r['tonic']}, {r['bars']} bars, LH span {r['lhSpan']}, problems {len(r['problems'])}")
        for row in r["rows"]:
            print(f"  bar {row['bar']:>2} {row['symbol']!s:7} LH {' '.join(row['lh']):34} roles {row['roles']} "
                  f"appr {row['approach'] and row['approach']['pcInterval']}/{row['approach'] and row['approach']['toNextFirstNote']} "
                  f"RH {row['rh']} {row['rhDur']} form {'ok' if row.get('formOk') else 'NO'}")
        for p in r["problems"]:
            print("  PROBLEM", p)
    out.write_text(json.dumps(res, indent=1, default=str), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
