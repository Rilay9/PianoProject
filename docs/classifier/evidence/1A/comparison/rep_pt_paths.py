"""Does partitura's unfolding ever take a D.S./D.C./coda jump on a catalogue file? Its importer makes jump objects only from <sound> attributes
(partitura/io/importmusicxml.py). This lists, for every catalogue file with repeat structure, whether the raw XML carries any <sound> jump attribute,
and for those files the bar counts of ALL paths partitura's get_paths gives (the sensible one is among them or not). Writes rep_pt_paths.json."""
import sys, json, re
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from rcommon import *
walk, common, rr = load_validators()
from common import BYID, cache
S = json.load(open(OUT / "rep_structure.json", encoding="utf8"))
sys.setrecursionlimit(20000)
import partitura as pt
from partitura import score as ps

res = {}
for i in S:
    w = cache(i)
    sj = [d["attrs"] for d in w["dirs"] if d["kind"] == "soundjump" and d["part"] == 0]
    if not sj:
        continue
    row = {"printed": len(S[i]["structure"]) and S[i]["printed"], "sound_attrs": sorted({k for a in sj for k in a}), "jump_words": bool(S[i]["jump_words"])}
    try:
        part = pt.load_musicxml(str(CONTENT / BYID[i]["file"])).parts[0]
        row["pt_objects"] = {n: len(list(part.iter_all(getattr(ps, n)))) for n in ("DaCapo", "DalSegno", "Fine", "Segno", "Coda", "ToCoda", "Repeat", "Ending") if hasattr(ps, n)}
        paths = ps.get_paths(part, no_repeats=False, all_repeats=False, ignore_leap_info=True)
        row["n_paths"] = len(paths)
        lens = []
        for p in paths:
            up = ps.new_part_from_path(p, part, update_ids=False)
            lens.append(len(list(up.iter_all(ps.Measure))))
        row["path_bar_counts"] = sorted(set(lens))[:20]
    except Exception as e:
        row["error"] = repr(e)[:120]
    res[i] = row
print("files with repeat structure and a <sound> jump attribute in part 0:", len(res), "of", len(S))
for i, r in res.items():
    print(i, json.dumps(r, ensure_ascii=False))
json.dump(res, open(OUT / "rep_pt_paths.json", "w", encoding="utf8"), indent=1, ensure_ascii=False)
