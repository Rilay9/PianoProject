"""Station 1 step 1, the CSV half: every PDMX.csv row containing "blues riff" (any creator), every
row containing "12 bar blues" (counted; listed when by the same creator), and every row by the
same creator (composer "Daniels Elizabeth Calvin" or artist "Lessons - Blues"). Writes hits.json."""
import csv
import json
import os
from pathlib import Path

csv.field_size_limit(10**9)
HERE = Path(__file__).resolve().parent
A = Path(os.environ["PIANOPATH_PDMX_DIR"])
F = ("title", "song_name", "subtitle", "artist_name", "composer_name")
n = 0
riff, twelve, creator = [], [], []
with open(A / "PDMX.csv", encoding="utf-8", newline="") as fh:
    for row in csv.DictReader(fh):
        n += 1
        t = " ".join((row.get(f) or "") for f in F).lower()
        who = ((row.get("composer_name") or "") + " | " + (row.get("artist_name") or "")).lower()
        same = "daniels elizabeth" in who or "lessons - blues" in who
        if "blues riff" in t:
            riff.append(row)
        if "12 bar blues" in t or "12-bar blues" in t or "twelve bar blues" in t:
            twelve.append((same, row))
        if same:
            creator.append(row)


def brief(r):
    return {"cid": r["mxl"].rsplit("/", 1)[1][:-4], "member": r["mxl"].lstrip("./"), "title": r["title"],
            "song_name": r["song_name"], "composer": r["composer_name"], "artist": r["artist_name"],
            "tracks": r["tracks"], "bars": r["song_length.bars"], "rating": r["rating"],
            "n_ratings": r["n_ratings"], "license": r["license"], "dedup": r["subset:deduplicated"],
            "no_license_conflict": r.get("subset:no_license_conflict")}


print(f"rows {n}; 'blues riff' {len(riff)}; '12 bar blues' {len(twelve)} "
      f"(same creator {sum(1 for s, _ in twelve if s)}); rows by the creator {len(creator)}")
out = {"rows": n, "blues_riff": [brief(r) for r in riff],
       "twelve_bar_same_creator": [brief(r) for s, r in twelve if s],
       "twelve_bar_other_count": sum(1 for s, _ in twelve if not s),
       "by_creator": [brief(r) for r in creator]}
(HERE / "hits.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
for k in ("blues_riff", "twelve_bar_same_creator", "by_creator"):
    print("==", k)
    for b in out[k]:
        print(f"  {b['cid']} | {b['title'][:45]} | {b['song_name'][:25]} | {b['composer'][:28]} | "
              f"{b['artist'][:20]} | tracks={b['tracks']} bars={b['bars']} rating={b['rating']}/{b['n_ratings']} "
              f"dedup={b['dedup']} nlc={b['no_license_conflict']}")
