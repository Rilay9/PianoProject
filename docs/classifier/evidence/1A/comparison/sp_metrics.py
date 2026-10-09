"""Tables of the spelling comparison from sp_results_<set>.json -> sp_metrics.json and frag_*.md.

False-flag rate on correct scores: flags per 1,000 notes and the share of pieces with any flag, per method, per set.
Notes = the project's note array (partitura, tied notes merged). A flag is a note (kinds from PS13 / PKSpell / filter) or a
pair of consecutive notes (test 2b); the two are added where a row combines them. Pieces for which no note table could be built
(3 catalogue items the reader and partitura both raise on) are left out of every row of a set (common set).
"""
from cmp_common import *
import csv, statistics

SETS = ["wir", "m21ch", "m21kb", "cat_gen", "cat_pdmx", "cat_other"]
R = {s: json.load(open(HERE / f"sp_results_{s}.json", encoding="utf8")) for s in SETS}

METHODS = [   # (id, label, function(record) -> flag count)
    ("kind2", "current: spelling filter (PS13 differs, PS13 diatonic, written not) = rule 26 kind 2", lambda r: r["kind2"]),
    ("t2b", "current: test 2b (augmented/diminished melodic step that an enharmonic respelling makes plain)", lambda r: r["t2b"]),
    ("cur", "current detector: kind 2 + test 2b", lambda r: r["kind2"] + r["t2b"]),
    ("curfix", "current detector with fix v1: kind 2 + test 2b cleared by fix v1", lambda r: r["kind2"] + r["t2b_fix"]),
    ("ps13", "ps13 (partitura): every difference from the written spelling", lambda r: r["ps13_diff"]),
    ("pks", "PKSpell: every difference from the written spelling", lambda r: r["pks_diff"]),
    ("pksg", "PKSpell with the kind-2 diatonic gate", lambda r: r["pks_gate"]),
    ("both", "ps13 and PKSpell agree on a spelling that differs from the written one", lambda r: r["both_diff"]),
    ("bothg", "the same, with the diatonic gate", lambda r: r["both_gate"]),
    ("curfix2", "current detector with fix v2: kind 2 + test 2b cleared by fix v2", lambda r: r["kind2"] + r["t2b_fix2"]),
    ("pksg_fix", "PKSpell with the gate + test 2b with fix v1", lambda r: r["pks_gate"] + r["t2b_fix"]),
    ("pksg_fix2", "PKSpell with the gate + test 2b with fix v2", lambda r: r["pks_gate"] + r["t2b_fix2"]),
]
LABEL = {m[0]: m[1] for m in METHODS}


def ok(r):
    return "n_notes" in r and r["n_notes"] > 0 and "t2b" in r and "pks_diff" in r


def table(recs):
    recs = [r for r in recs if ok(r)]
    n = sum(r["n_notes"] for r in recs)
    out = {"pieces": len(recs), "notes": n, "rows": {}}
    for mid, lab, fn in METHODS:
        fl = [fn(r) for r in recs]
        out["rows"][mid] = {"flags": sum(fl), "per1000": round(1000 * sum(fl) / n, 2) if n else None,
                            "pieces_flagged": sum(1 for x in fl if x > 0),
                            "share_pieces": round(100 * sum(1 for x in fl if x > 0) / len(recs), 1) if recs else None}
    return out


def md(tab, title=None):
    lines = []
    if title:
        lines.append(f"**{title}: {tab['pieces']} pieces, {tab['notes']:,} notes.**\n")
    lines.append("| method | flags | flags per 1,000 notes | pieces with a flag |")
    lines.append("| --- | --- | --- | --- |")
    for mid, lab, fn in METHODS:
        r = tab["rows"][mid]
        lines.append(f"| {lab} | {r['flags']:,} | {r['per1000']} | {r['pieces_flagged']} of {tab['pieces']} ({r['share_pieces']}%) |")
    return "\n".join(lines) + "\n"


# ----------------------------------------------------------------------------- ASAP overlap (PKSpell's training data)
ASAP = {}
meta = BUILD / "asap_meta/metadata.csv"
if meta.exists():
    for row in csv.DictReader(open(meta, encoding="utf8")):
        ASAP.setdefault(row["composer"], set()).add(row["folder"])


def asap_listed(label):
    """Is this When in Rome piece a work that appears in ASAP (the data PKSpell was trained on, per its README)? Matched by work."""
    p = label.split("/")
    if "Well-Tempered_Clavier_I" in label:
        bwv = 845 + int(p[-1])
        return f"Bach/Prelude/bwv_{bwv}" in ASAP.get("Bach", set())
    if p[2].startswith("Chopin") and p[3].startswith("Études_Op.10"):
        return f"Chopin/Etudes_op_10/{p[-1]}" in ASAP.get("Chopin", set())
    if p[2].startswith("Mozart"):
        k = p[3]; mv = p[-1]
        sonata = {"K279": 1, "K280": 2, "K281": 3, "K282": 4, "K283": 5, "K284": 6, "K309": 7, "K310": 8, "K311": 9, "K330": 10,
                  "K331": 11, "K332": 12, "K333": 13, "K457": 14, "K533": 15, "K545": 16, "K570": 17, "K576": 18}.get(k)
        return sonata is not None and f"Mozart/Piano_Sonatas/{sonata}-{mv}" in ASAP.get("Mozart", set())
    return False


def seconds(recs, field):
    v = [r[field] for r in recs if r.get(field) is not None]
    if not v:
        return None
    return f"{statistics.mean(v):.3f} / {statistics.median(v):.3f} / {max(v):.3f}"


def main():
    M = {}
    frag = []
    pub = [r for s in ("wir", "m21ch", "m21kb") for r in R[s]]
    wir = R["wir"]
    for r in wir:
        r["asap"] = asap_listed(r["label"])
    M["wir"] = table(wir); M["m21ch"] = table(R["m21ch"]); M["m21kb"] = table(R["m21kb"])
    M["wir_asap"] = table([r for r in wir if r["asap"]]); M["wir_not_asap"] = table([r for r in wir if not r["asap"]])
    M["published_all"] = table(pub)
    M["published_not_asap"] = table([r for r in pub if not r.get("asap", False) and not r["label"].startswith("Corpus/Bach")])
    for s in ("cat_gen", "cat_pdmx", "cat_other"):
        M[s] = table(R[s])
    for k, title in [("wir", "When in Rome keyboard (81 pieces)"), ("wir_asap", "When in Rome, works that are in ASAP (PKSpell's training data)"),
                     ("wir_not_asap", "When in Rome, works not in ASAP"), ("m21ch", "music21 corpus, Bach chorales"),
                     ("m21kb", "music21 corpus, keyboard works (9)"), ("published_all", "All published scores"),
                     ("cat_gen", "Our catalogue, generated items (candidates, not false flags: spelling not independently checked)"),
                     ("cat_pdmx", "Our catalogue, PDMX items (candidates)"), ("cat_other", "Our catalogue, other real items (candidates)")]:
        frag.append(md(M[k], title)); (HERE / f"frag_m_{k}.md").write_text(md(M[k], title), encoding="utf8")
    # per-piece table for the 9 keyboard works
    lines = ["| piece | notes | kind 2 | test 2b | 2b after fix | ps13 diffs | PKSpell diffs | PKSpell + gate |", "| --- | --- | --- | --- | --- | --- | --- | --- |"]
    for r in R["m21kb"]:
        lines.append(f"| {r['label']} | {r.get('n_notes')} | {r.get('kind2')} | {r.get('t2b')} | {r.get('t2b_fix')} | {r.get('ps13_diff')} | {r.get('pks_diff')} | {r.get('pks_gate')} |")
    frag.append("\n".join(lines) + "\n"); (HERE / "frag_m21kb_pieces.md").write_text("\n".join(lines) + "\n", encoding="utf8")
    # runtime
    rt = ["| step | published scores (pieces, notes median) | seconds per piece: mean / median / max | our catalogue | seconds per item: mean / median / max |", "| --- | --- | --- | --- | --- |"]
    cat = [r for s in ("cat_gen", "cat_pdmx", "cat_other") for r in R[s]]
    for fld, lab in [("load_s", "read the file into the note table (project reader, partitura)"), ("ps13_s", "ps13 estimate_spelling"),
                     ("pks_s", "PKSpell model call (CPU, 2 threads, after one-off import and load)"),
                     ("walk_s", "raw MusicXML walk (first reading; needed by test 2b)"), ("t2b_s", "test 2b over the walk")]:
        rt.append(f"| {lab} | {len([r for r in pub if r.get(fld) is not None])} | {seconds(pub, fld)} | {len([r for r in cat if r.get(fld) is not None])} | {seconds(cat, fld)} |")
    med_notes_pub = statistics.median([r["n_notes"] for r in pub if r.get("n_notes")]); med_notes_cat = statistics.median([r["n_notes"] for r in cat if r.get("n_notes")])
    rt.append(f"| notes per piece (mean / median / max) | | {statistics.mean([r['n_notes'] for r in pub if r.get('n_notes')]):.0f} / {med_notes_pub:.0f} / {max(r['n_notes'] for r in pub if r.get('n_notes'))} | | {statistics.mean([r['n_notes'] for r in cat if r.get('n_notes')]):.0f} / {med_notes_cat:.0f} / {max(r['n_notes'] for r in cat if r.get('n_notes'))} |")
    frag.append("\n".join(rt) + "\n"); (HERE / "frag_runtime.md").write_text("\n".join(rt) + "\n", encoding="utf8")
    M["whole_piece"] = {s: {"ps13": [r["label"] for r in R[s] if ok(r) and r["ps13_diff"] >= 0.2 * r["n_notes"]], "pks": [r["label"] for r in R[s] if ok(r) and r["pks_diff"] >= 0.2 * r["n_notes"]]} for s in SETS}
    M["runtime_lines"] = rt
    # reader fallback count
    M["reader_fallback"] = {s: sum(1 for r in R[s] if r.get("reader_ok") is False) for s in SETS}
    M["note_table_failed"] = {s: [r["label"] for r in R[s] if "note_error" in r] for s in SETS}
    json.dump(M, open(HERE / "sp_metrics.json", "w", encoding="utf8"), indent=1, ensure_ascii=False)
    (HERE / "frag_metrics.md").write_text("\n".join(frag), encoding="utf8")
    print("\n".join(frag))
    print(M["reader_fallback"], M["note_table_failed"]); print("whole-piece (>=20% of notes differ):", {s: {k: len(v) for k, v in d.items()} for s, d in M["whole_piece"].items()}, {s: d for s, d in M["whole_piece"].items() if s in ("wir","m21kb","m21ch")})
    print("asap_listed wir:", sum(1 for r in wir if r["asap"]), "of", len(wir))


if __name__ == "__main__":
    main()
