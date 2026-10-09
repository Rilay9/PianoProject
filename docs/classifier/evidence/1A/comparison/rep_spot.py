"""The 12-file spot-check sample of rep_readings.py: random.seed(7); random.sample of 12 from the sorted ids of the files where the readers that gave a
count agree (every file not in the disagreement set). Checks that the sample equals the SPOT list hand-read in rep_readings.py."""
import json, random, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
R = json.load(open(HERE / "rep_readers.json", encoding="utf8"))
dis = {r["id"] for r in json.load(open(HERE / "rep_disagreements.json", encoding="utf8"))
       if len({r[k] for k in ("unroller", "unroller_cp", "music21", "pt_max_noleap") if isinstance(r[k], int)}) > 1}
rest = sorted(i for i in R if i not in dis)
random.seed(7)
sample = random.sample(rest, 12)
import rep_readings
print("agreed files:", len(rest), "| sample equals rep_readings.SPOT:", set(sample) == set(rep_readings.SPOT))
