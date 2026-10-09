"""notation.chord-symbols, step 3 (the role of the notes under each symbol): the current rule, the smallest fix its validation row points to, and the
melody-location candidates.

Step 3 as docs/classifier/rules/area-1A.md section 21 writes it, per de-duplicated symbol, by the role of the notes in the symbol's bar:
  alone                       no struck note (slash noteheads excluded) of the symbol's part in the bar;
  over a melody line          struck notes, and the bar's melody is settled on a staff by texture.melody-location (validation/r_melody.py rules 1, 2, 3);
  over written accompaniment  struck notes, and the bar is an accompaniment-pattern bar by the texture rules (r_melody.pattern_bars), or the generated family states it;
  UNKNOWN                     otherwise.
Variants:
  current   the rule above, with the generated family's statement empty (the family contract states no role);
  fix       the same, with the generated family's statement used first (step 3's own words "or the generated family states it"). The fix measured is the
            smallest the validation row's evidence points to: the montuno family is given the role its contract name states ("a right-hand montuno of
            chord tones on the clave's strokes": accompaniment). Nothing else is changed;
  skyline   "over a melody line" whenever struck notes sound (a skyline names a top note in every bar with notes).
Expected role per named item: stated in NAMED below from the score (the notes in the symbol bars, printed by build/probe9-style reading) or the family contract.
Outputs: chord_role_items.json, chord_role_generated.json. MIDI of the named items for MidiBERT: build/chord/<id>.mid + <id>.notes.json (mb_items.py).
"""
import sys, json, collections
from mel_common import *
load_validators()
import common
from walk import cache, BYID
import r_melody as RM
import score as S
import mido

FAMILY_ROLE_FIX = {"montuno": "over written accompaniment"}   # from the contract name, the one family the validation row names

NAMED = {
    "exercise.montuno.a.2note.son-3-2": ("over written accompaniment", "score: right hand only, two-note chord-tone figure on the clave strokes, no line; contract name 'a right-hand montuno of chord tones'"),
    "song.classical.1818-franz-xaver-gruber-silent-night.pdmx": ("over a melody line", "score: one staff, single notes (the tune), symbols above it"),
    "exercise.blues.twelve-bar-shuffle.c": ("over written accompaniment", "score: right-hand seventh chords on beats 1 and 3, left-hand shuffle bass; no line"),
    "exercise.slash-bass.c": ("over written accompaniment", "score: held triads in the right hand, walking bass in the left; no line"),
    "song.classical.czerny-the-school-of-velocity-op-299-no-10.pdmx": ("per bar: right hand sounds -> over a melody line; left hand alone -> over written accompaniment",
                                                                        "score (reading): the left hand is a continuous broken-chord figure, the right hand the running line; judged, not annotated"),
}


def symbol_bars(w):
    d = [h for h in common.dedup_symbols(w) if h["kind"] != "none"]
    return d


def struck_by_bar(w):
    c = collections.Counter()
    for n in w["notes"]:
        if common.struck(n) and n["notehead"] != "slash":
            c[(n["part"], n["m"])] += 1
    return c


def staff_notes_by_bar(w):
    d = collections.defaultdict(lambda: collections.defaultdict(list))
    for n in w["notes"]:
        if common.struck(n) and n["notehead"] != "slash":
            d[n["m"]][n["staff"]].append(n)
    return d


def item_roles(i):
    w = cache(i)
    sy = symbol_bars(w)
    sb = struck_by_bar(w)
    fam = (BYID[i].get("drill") or {}).get("generator", {}).get("family") if i.startswith("exercise.") else None
    melody = RM.melody(i)
    sc = S.load(BYID[i], content=RM.HERE)
    pb = RM.pattern_bars(sc)
    out = []
    for h in sy:
        m = h["m"]
        has = sb.get((h["part"], m), 0) > 0
        mel = isinstance(melody, dict) and "unknown" not in melody and melody.get(m) is not None and not str(melody[m][0]).startswith("UNKNOWN")
        rule = melody[m][0] if mel else None
        pat = any(m in pb.get(hh, set()) for hh in pb)
        def role(use_family):
            if not has:
                return "alone"
            if use_family and fam in FAMILY_ROLE_FIX:
                return FAMILY_ROLE_FIX[fam]
            if mel:
                return "over a melody line"
            if pat:
                return "over written accompaniment"
            return "UNKNOWN role of the notes"
        out.append({"bar": m, "has_notes": has, "melody_rule": rule, "pattern_bar": pat, "current": role(False), "fix": role(True),
                    "skyline": "over a melody line" if has else "alone"})
    return out, fam


def expected_czerny(i, rows):
    sn = staff_notes_by_bar(cache(i))
    for r in rows:
        s = sn.get(r["bar"], {})
        r["expected"] = "over a melody line" if s.get(1) else ("over written accompaniment" if s.get(2) else "alone")


if __name__ == "__main__":
    named = {}
    for i, (exp, why) in NAMED.items():
        rows, fam = item_roles(i)
        if i.startswith("song.classical.czerny"):
            expected_czerny(i, rows)
        else:
            for r in rows:
                r["expected"] = exp
        named[i] = {"expected_text": exp, "why": why, "family": fam, "symbols": len(rows), "rows": rows}
    jdump(named, HERE / "chord_role_items.json")
    gen = {}
    for i in BYID:
        if not i.startswith("exercise.") or not cache(i)["harm"]:
            continue
        rows, fam = item_roles(i)
        w = cache(i)
        # signature of the validation row's failure: every symbol bar answered "over a melody line" by rule 1/3 while the only sounding staff plays chords
        sn = staff_notes_by_bar(w)
        chordonly = all(len(sn.get(r["bar"], {})) == 1 and all(len({n["t"] for n in ns}) and True for ns in sn[r["bar"]].values()) for r in rows) if rows else False
        allchords = False
        if rows:
            allchords = True
            for r in rows:
                s = sn.get(r["bar"], {})
                if len(s) != 1:
                    allchords = False; break
                ns = list(s.values())[0]
                byon = collections.Counter(n["t"] for n in ns)
                if not byon or min(byon.values()) < 2:
                    allchords = False; break
        gen[i] = {"family": fam, "symbols": len(rows), "current": dict(collections.Counter(r["current"] for r in rows)),
                  "fix": dict(collections.Counter(r["fix"] for r in rows)), "one_staff_all_chords": allchords,
                  "melody_rules": dict(collections.Counter(str(r["melody_rule"]) for r in rows))}
    jdump(gen, HERE / "chord_role_generated.json")
    # MIDI of the named items for MidiBERT
    outd = BUILD / "chord"; outd.mkdir(exist_ok=True)
    for i in NAMED:
        sc = S.load(BYID[i], content=RM.HERE)
        n = sc.notes
        notes = [{"on": float(n["onset_quarter"][k]), "dur": float(n["duration_quarter"][k]), "pitch": int(n["pitch"][k]), "bar": int(sc.measure[k])} for k in range(len(n))]
        t0 = min(x["on"] for x in notes)
        mf = mido.MidiFile(type=0, ticks_per_beat=480); tr = mido.MidiTrack(); mf.tracks.append(tr)
        tr.append(mido.MetaMessage("set_tempo", tempo=500000, time=0)); tr.append(mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0))
        ev = []
        for x in notes:
            ev.append((int(round((x["on"] - t0) * 480)), 1, x["pitch"])); ev.append((int(round((x["on"] - t0 + max(x["dur"], 1 / 16)) * 480)), 0, x["pitch"]))
        ev.sort(key=lambda e: (e[0], e[1])); last = 0
        for t, o, p in ev:
            tr.append(mido.Message("note_on", note=p, velocity=64 if o else 0, time=t - last)); last = t
        mf.save(str(outd / f"{i}.mid"))
        jdump({"t0": t0, "notes": notes}, outd / f"{i}.notes.json")
    print("done", len(named), len(gen))
