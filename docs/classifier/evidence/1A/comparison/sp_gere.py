"""Digest of the Gere, Audebert, Jacquemard checker (build/gere, run in build/venv-gere as `detect_errors check --mode both`)
-> sp_gere.json, frag_gere.md.

What it checks (read from build/gere/src): 'individual' = each note's written type and dots against its <duration> and <divisions>, and
backup/forward durations expressible as note values; 'contextual' = an automaton over each measure's voices (single-part files only: a
file with more than one part returns the error 'More than 1 part', which is a limit of the tool, counted here as not applicable).
It does not look at pitch spelling. Ground truth: the same published scores (false flags = any error reported on them) and, for catch,
the files with an unclosed tuplet bracket (rule 26 kind 4: a <tuplet type="start"> while one with the same number is open) found by
the validators' own `unusual()` function over our catalogue.
"""
from cmp_common import *
import collections
import r_misc                                    # validation/r_misc.py (unusual())

pub = {s: json.load(open(HERE / f"sp_results_{s}.json", encoding="utf8")) for s in ("wir", "m21ch", "m21kb")}
cat = {s: json.load(open(HERE / f"sp_results_{s}.json", encoding="utf8")) for s in ("cat_gen", "cat_pdmx", "cat_other")}
P = {p["key"]: p for p in json.load(open(HERE / "sp_pieces.json", encoding="utf8"))["pieces"]}
PREP = json.load(open(HERE / "sp_prepare.json", encoding="utf8"))
G = {"pub": json.load(open(BUILD / "gere_published2.json", encoding="utf8"))}      # gere_run.py output (cli.py's arguments, one try/except per file)
if (BUILD / "gere_cat2.json").exists():
    G["cat"] = json.load(open(BUILD / "gere_cat2.json", encoding="utf8"))


def norm(p):
    return str(Path(p)).replace("\\", "/").lower()


def digest(g, recs_by_set):
    ind = {norm(k): v for k, v in g.get("individual", {}).items()}
    con = {norm(k): v for k, v in g.get("contextual", {}).items()}
    crashed = {norm(k): v for k, v in g.get("crashed", {}).items()}
    out, msgs = {}, collections.Counter()
    for s, recs in recs_by_set.items():
        n = len(recs); notes = sum(r.get("n_notes", 0) for r in recs)
        a = collections.Counter(); nerr = 0
        for r in recs:
            f = norm(P[r["key"]]["path"])
            if f in crashed:
                a["crashed"] += 1
            if f in ind and ind[f]:
                a["individual"] += 1; nerr += sum(len(v) for v in ind[f].values())
                for v in ind[f].values():
                    for m in v: msgs["ind: " + str(m).split(">:")[-1].strip()[:50]] += 1
            if f in con:
                c = con[f]
                if list(c.keys()) == ["global"] and any("More than 1 part" in str(x) for x in c["global"]):
                    a["not_applicable_multipart"] += 1
                else:
                    a["contextual"] += 1; nerr += sum(len(v) for v in c.values())
                    for k, v in c.items():
                        for m in v: msgs["ctx: " + type(m).__name__ if not isinstance(m, str) else "ctx: " + str(m)[:50]] += 1
            if f in ind and ind[f] or (f in con and not (list(con[f].keys()) == ["global"])):
                a["any"] += 1
        out[s] = {"files": n, "notes": notes, "individual": a["individual"], "contextual": a["contextual"], "any_error": a["any"],
                  "not_applicable_multipart": a["not_applicable_multipart"], "crashed": a["crashed"], "errors": nerr,
                  "errors_per_1000_notes": round(1000 * nerr / notes, 3) if notes else None}
    return out, msgs


res = {}
res["published"], res["published_msgs"] = digest(G["pub"], pub)
if "cat" in G:
    res["catalogue"], res["catalogue_msgs"] = digest(G["cat"], cat)
    # unclosed tuplet brackets (kind 4)
    unclosed = []
    for s, recs in cat.items():
        for r in recs:
            try:
                w = walk_path(P[r["key"]]["path"], "sp_" + PREP[r["key"]]["hash"]) if "hash" in PREP[r["key"]] else None
                if w is None:
                    w = walk_path(P[r["key"]]["path"], "sp_" + __import__("hashlib").sha1(r["key"].encode()).hexdigest()[:12])
                if r_misc.unusual(w)["unclosed"]:
                    unclosed.append(r["label"])
            except Exception as e:                     # noqa
                pass
    ind = {norm(k): v for k, v in G["cat"].get("individual", {}).items()}
    con = {norm(k): v for k, v in G["cat"].get("contextual", {}).items()}
    cr = {norm(k): v for k, v in G["cat"].get("crashed", {}).items()}
    det = []
    for lab in unclosed:
        f = norm(P["cat:" + lab]["path"])
        det.append({"item": lab, "individual": bool(ind.get(f)), "contextual": bool(con.get(f)) and list(con[f].keys()) != ["global"],
                    "multipart": bool(con.get(f)) and list(con[f].keys()) == ["global"], "crashed": f in cr})
    res["unclosed_tuplet_files"] = det
res["messages_top"] = {k: v for k, v in (res["published_msgs"] + res.get("catalogue_msgs", collections.Counter())).most_common(15)}
for k in ("published_msgs", "catalogue_msgs"):
    res.pop(k, None)
json.dump(res, open(HERE / "sp_gere.json", "w", encoding="utf8"), indent=1)
L = ["| set | files | notes | files with an individual-check error | files with a contextual-check error | contextual not applicable (more than one part) | files with any error | tool crashed on the file | errors per 1,000 notes |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
for part in ("published", "catalogue"):
    for s, v in res.get(part, {}).items():
        L.append(f"| {s} | {v['files']} | {v['notes']:,} | {v['individual']} | {v['contextual']} | {v['not_applicable_multipart']} | {v['any_error']} ({100 * v['any_error'] / v['files']:.1f}%) | {v['crashed']} | {v['errors_per_1000_notes']} |")
(HERE / "frag_gere.md").write_text("\n".join(L) + "\n", encoding="utf8")
print("\n".join(L)); print(json.dumps(res.get("unclosed_tuplet_files"), indent=0)); print(res["messages_top"])
