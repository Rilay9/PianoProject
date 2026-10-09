"""Tables for notation.chord-symbols from chord_parse_*.json, chord_role_*.json and chord_mb_results.json -> frag_chord_*.md and chord_metrics.json."""
import collections, json
from mel_common import *
load_validators()
import common
from walk import cache, BYID
import r_misc

items = jload(HERE / "chord_parse_items.json")
text = jload(HERE / "chord_parse_text.json")
roles = jload(HERE / "chord_role_items.json")
gen = jload(HERE / "chord_role_generated.json")
mb = jload(HERE / "chord_mb_results.json") if (HERE / "chord_mb_results.json").exists() else {}
M = {}
frag = []

# ---- parse table 1: <harmony> reading
rows = []
for pl in ("generated", "pdmx", "other", "all"):
    its = {k: v for k, v in items.items() if pl == "all" or v["pipeline"] == pl}
    ok = {k: v for k, v in its.items() if v["m21_error"] is None}
    rows.append({
        "pipeline": pl, "items": len(its), "m21_errors": len(its) - len(ok),
        "raw_walk": sum(v["raw_walk"] for v in its.values()), "raw_m21": sum(v["m21_raw"] for v in ok.values()),
        "dedup_walk": sum(v["dedup_walk"] for v in its.values()), "dedup_m21": sum(v["m21_dedup"] for v in ok.values()),
        "nc_walk": sum(v["nc_walk"] for v in its.values()), "nc_m21": sum(v["m21_nc"] for v in ok.values()),
        "slash_walk": sum(v["slash_walk"] for v in its.values()), "slash_m21": sum(v["m21_slash"] for v in ok.values()),
        "ref_slash": sum(v["ref_slash"] for v in its.values()),
        "walk_equal": sum(1 for v in its.values() if v["walk_multiset_equal"]),
        "m21_equal": sum(1 for v in ok.values() if v["m21_multiset_equal"]),
    })
M["parse_harmony"] = rows
frag.append("| pipeline | items with `<harmony>` | symbols raw: current walk / music21 | after de-duplication: walk / music21 | N.C.: walk / music21 | slash chords: walk / music21 (reference) | items whose symbols (root, bass, N.C.) equal the reference: current / music21 | music21 errors |\n| --- | --- | --- | --- | --- | --- | --- | --- |")
for r in rows:
    frag.append(f"| {r['pipeline']} | {r['items']} | {r['raw_walk']} / {r['raw_m21']} | {r['dedup_walk']} / {r['dedup_m21']} | {r['nc_walk']} / {r['nc_m21']} | {r['slash_walk']} / {r['slash_m21']} ({r['ref_slash']}) | {r['walk_equal']} / {r['m21_equal']} | {r['m21_errors']} |")
kinds = collections.Counter()
for v in items.values():
    for k, c in (v.get("m21_kinds") or {}).items():
        kinds[k] += c
M["m21_kinds"] = dict(kinds)
# ---- parse table 2: text route
tot = sum(e["count"] for e in text.values())
stat = {}
for name in ("m21", "tonal", "regex"):
    ok = rb = okt = rbt = 0
    for s, e in text.items():
        x = e[name]
        if x["ok"]:
            ok += 1; okt += e["count"]
        if name != "regex" and x["ok"] and x["root"] == e["truth_root"] and x["bass"] == e["truth_bass"]:
            rb += 1; rbt += e["count"]
    stat[name] = {"strings_parsed": ok, "strings_root_bass_right": rb if name != "regex" else None, "symbols_parsed": okt, "symbols_root_bass_right": rbt if name != "regex" else None}
M["parse_text"] = {"distinct": len(text), "symbols": tot, **stat}
bad = {"m21": [], "tonal": []}
for s, e in text.items():
    for name in ("m21", "tonal"):
        x = e[name]
        if not (x["ok"] and x["root"] == e["truth_root"] and x["bass"] == e["truth_bass"]):
            bad[name].append((s, e["count"], x))
M["parse_text_failures"] = {k: [(a, b, str(c)) for a, b, c in sorted(v, key=lambda z: -z[1])[:12]] for k, v in bad.items()}
frag.append("\n**Text route**: " + json.dumps(M["parse_text"]))

# ---- text candidates on the named text items (words, no <harmony>)
TEXT_ITEMS = {
    "song.pop.coldplay-fix-you-coldplay.pdmx": "reading: real chord symbols typed as words (validation row)",
    "song.classical.i-got-rythm.pdmx": "reading: real chord symbols typed as words (validation row)",
    "song.classical.handel-halvorsen-passacaglia": "reading: real chord symbols typed as words (validation row)",
    "song.classical.chopin-chopin-waltz-in-a-minor-piano-solo.pdmx": "reading: note-name reading aids, not chord symbols (validation row)",
    "song.classical.mozart-mozart-minuet-in-f-major-k2-easy.pdmx": "reading: digit words (fingerings), not Nashville numbers (validation row)",
}
import sys
sys.path.insert(0, str(HERE))
import chord_parse as CP
cand = {}
for i, why in TEXT_ITEMS.items():
    if i not in BYID:
        cand[i] = {"why": why, "in_catalogue": False}; continue
    c = r_misc.chord_symbols(cache(i))["text_candidates"]
    cand[i] = {"why": why, "regex_candidates": c}
allc = sorted({s for v in cand.values() for s in v.get("regex_candidates", [])})
tn = CP.tonal_batch(allc) if allc else {}
from music21 import harmony
for i, v in cand.items():
    v["tonal"] = {s: (tn[s]["name"] or "not a chord") for s in v.get("regex_candidates", [])}
    m = {}
    for s in v.get("regex_candidates", []):
        try:
            h = harmony.ChordSymbol(s); m[s] = h.chordKind
        except Exception as e:
            m[s] = "error " + type(e).__name__
    v["m21"] = m
M["text_candidates"] = cand

# ---- role on the named items
tab = []
for i, r in roles.items():
    rows_ = r["rows"]
    c = collections.Counter()
    for q in rows_:
        for name in ("current", "fix", "skyline"):
            c[(name, q[name] == q["expected"] or (q["expected"] == "over a melody line" and False))] += 1
    mbres = mb.get(i)
    mb_role = None
    if mbres:
        notes = jload(BUILD / "chord" / f"{i}.notes.json")["notes"]
        pred = set(mbres["midibert"]["idx"]) | set(mbres["midibert"].get("idx_bridge", []))   # a bar with a melody or bridge line = a melodic line is there
        bars_mel = collections.Counter(notes[k]["bar"] for k in pred)
        has = collections.Counter(n["bar"] for n in notes)
        mb_role = []
        for q in rows_:
            mb_role.append("alone" if not q["has_notes"] else ("over a melody line" if bars_mel.get(q["bar"]) else "over written accompaniment"))
    tab.append({"item": i, "expected": r["expected_text"], "why": r["why"], "symbols": r["symbols"],
                "current_right": c[("current", True)], "fix_right": c[("fix", True)], "skyline_right": c[("skyline", True)],
                "current_answers": dict(collections.Counter(q["current"] for q in rows_)), "fix_answers": dict(collections.Counter(q["fix"] for q in rows_)),
                "midibert_right": (sum(1 for q, a in zip(rows_, mb_role) if a == q["expected"]) if mb_role else None),
                "midibert_answers": dict(collections.Counter(mb_role)) if mb_role else None})
M["role_named"] = tab
# ---- generated families
fam = collections.defaultdict(lambda: collections.Counter())
sig = collections.defaultdict(int)
nfam = collections.Counter()
for i, g in gen.items():
    f = g["family"]; nfam[f] += 1
    for k, v in g["current"].items():
        fam[f][("current", k)] += v
    for k, v in g["fix"].items():
        fam[f][("fix", k)] += v
    if g["one_staff_all_chords"] and set(g["current"]) == {"over a melody line"}:
        sig[f] += 1
M["generated"] = {f: {"items": nfam[f], "current": {k[1]: v for k, v in c.items() if k[0] == "current"}, "fix": {k[1]: v for k, v in c.items() if k[0] == "fix"},
                      "same_signature_items": sig.get(f, 0)} for f, c in fam.items()}
jdump(M, HERE / "chord_metrics.json")
print("\n".join(frag))
print(json.dumps(M["parse_text"]))
print(json.dumps(M["parse_text_failures"], indent=0)[:1500])
for t in tab:
    print(t["item"], t["symbols"], "cur", t["current_right"], "fix", t["fix_right"], "sky", t["skyline_right"], "mb", t["midibert_right"], t["current_answers"], t["fix_answers"])
print({f: (v["items"], v["same_signature_items"]) for f, v in M["generated"].items()})
print(json.dumps(M["text_candidates"], indent=0)[:2500])

# ---------------------------------------------------------------- markdown fragments
L = []
L.append("### Parse of `<harmony>` (reading the notation)\n")
L.extend(frag[:7])
L.append("")
L.append(f"music21 chord kinds read from `<harmony>` over all 460 items: {json.dumps(M['m21_kinds'])}")
L.append("")
L.append("### Parse of symbols typed as text (239 distinct printed strings, 2,628 symbols, built from each symbol's own printed root, kind text and bass)\n")
L.append("| parser | strings parsed | strings with the right root and bass | symbols parsed | symbols with the right root and bass |\n| --- | --- | --- | --- | --- |")
for name, lab in (("regex", "current text rule (the validators' pattern, `CHORD_TXT`)"), ("m21", "music21 `harmony.ChordSymbol(text)`"), ("tonal", "Tonal `Chord.get` (tonal 6.2.0)")):
    x = M["parse_text"][name]
    L.append(f"| {lab} | {x['strings_parsed']} / 239 | {x['strings_root_bass_right'] if x['strings_root_bass_right'] is not None else 'n/a (matches a pattern only)'} | {x['symbols_parsed']} / 2628 | {x['symbols_root_bass_right'] if x['symbols_root_bass_right'] is not None else 'n/a'} |")
L.append("")
L.append("### Text candidates on the named items without `<harmony>`\n")
L.append("| item | what it holds (reading) | words the current rule offers as symbols | Tonal | music21 |\n| --- | --- | --- | --- | --- |")
for i, v in M["text_candidates"].items():
    if not v.get("regex_candidates"):
        L.append(f"| {i} | {v['why']} | none | - | - |")
        continue
    c = collections.Counter(v.get("regex_candidates", []))
    L.append(f"| {i} | {v['why']} | {', '.join(f'{k}x{n}' if n > 1 else k for k, n in c.items())} | {'; '.join(f'{k}: {x}' for k, x in v['tonal'].items())} | {'; '.join(f'{k}: {x}' for k, x in v['m21'].items())} |")
L.append("")
L.append("### Role of the notes under each symbol, named items (symbols right / symbols)\n")
L.append("| item | expected role (source) | symbols | current step 3 | with the family fix | skyline | MidiBERT |\n| --- | --- | --- | --- | --- | --- | --- |")
for t in tab:
    mbc = f"{t['midibert_right']} / {t['symbols']} ({t['midibert_answers']})" if t["midibert_right"] is not None else "not run"
    L.append(f"| {t['item']} | {t['expected']} ({t['why']}) | {t['symbols']} | {t['current_right']} ({t['current_answers']}) | {t['fix_right']} ({t['fix_answers']}) | {t['skyline_right']} | {mbc} |")
L.append("")
L.append("### Generated items with symbols: current step 3 answer per symbol, the fix, and the same-signature count\n")
L.append("| family | items | current answers (symbols) | answers with the montuno fix | items whose only sounding staff plays chords in every symbol bar and are answered 'over a melody line' |\n| --- | --- | --- | --- | --- |")
for f_, v in sorted(M["generated"].items(), key=lambda kv: -kv[1]["items"]):
    L.append(f"| {f_} | {v['items']} | {v['current']} | {v['fix']} | {v['same_signature_items']} |")
(HERE / "frag_chord.md").write_text("\n".join(L), encoding="utf-8")
