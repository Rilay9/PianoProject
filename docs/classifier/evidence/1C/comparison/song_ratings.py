"""Song et al.'s syncopation dataset (111 rhythm patterns with listeners' ratings): read the rating workbook and the
.rhy stimuli, write song_stimuli.json.

Source: github.com/electronstudio/synpy (a fork of code.soundsoftware.ac.uk/projects/syncopation-dataset), commit in
syncopation.md section 2; the workbook is Raw_rating_data/Ratings for entire stimuli.xls.
Run with build/venv-synpy (numpy, xlrd):  build/venv-synpy/Scripts/python.exe song_ratings.py

Per stimulus: its metre (t{...}), the velocity sequence of each bar (v{...}), and the ratings of the 10 participants
(sheets "Inital set" and "extended set": one row per stimulus, columns Participant1..10, scale 0 to 4 as recorded).
mean_rating = mean of the participants' ratings that are numbers.
"""
import json, re, statistics
from pathlib import Path

import xlrd

HERE = Path(__file__).resolve().parent
WT = HERE.parents[4]
SRC = WT / "build/syn/synpy-electronstudio"
XLS = SRC / "Raw_rating_data/Ratings for entire stimuli.xls"
RHY = SRC / "Rhythm_stimuli_text_format"

wb = xlrd.open_workbook(str(XLS))
ratings = {}
for sheet in ("Inital set", "extended set"):
    s = wb.sheet_by_name(sheet)
    for r in range(1, s.nrows):
        row = s.row_values(r)
        name = str(row[0]).strip()
        vals = [float(v) for v in row[1:] if isinstance(v, (int, float))]
        if name:
            ratings.setdefault(name, []).append((sheet, vals))

out = {}
for f in sorted(RHY.glob("*.rhy")):
    name = f.stem
    txt = f.read_text(encoding="utf-8")
    ts = None
    bars = []
    for line in txt.splitlines():
        line = line.split("#")[0].replace(" ", "").replace("\t", "")
        m = re.match(r"t\{(\d+/\d+)\}", line)
        if m:
            ts = m.group(1)
        m = re.match(r"v\{([^}]*)\}", line)
        if m:
            bars.append([float(x) for x in m.group(1).split(",")])
    rt = ratings.get(name, [])
    allv = [v for _, vs in rt for v in vs]
    out[name] = {"ts": ts, "bars": bars, "rating_rows": len(rt), "n_ratings": len(allv),
                 "mean_rating": (sum(allv) / len(allv)) if allv else None,
                 "median_rating": statistics.median(allv) if allv else None,
                 "sheets": [s for s, _ in rt]}
Path(HERE / "song_stimuli.json").write_text(json.dumps(out, indent=0), encoding="utf-8")
missing = [k for k, v in out.items() if v["mean_rating"] is None]
dup = [k for k, v in out.items() if v["rating_rows"] > 1]
print(len(out), "stimuli; without ratings:", missing, "; with more than one rating row:", dup)
extra = sorted(set(ratings) - set(out))
print("rated names with no .rhy file:", extra)
