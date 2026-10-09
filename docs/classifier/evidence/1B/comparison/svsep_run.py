"""Run piano_svsep (build/piano_svsep @ 1462e7c2, pretrained_models/model.ckpt) on the files in a list and write the predicted
staff per note. Run with C:/vsv/Scripts/python.exe (build/venv-svsep through a junction):
    python svsep_run.py <list.json> <out.json>
list.json: [{"id":..., "file": <path under app/public/content>}]. out.json: {id: {"t": seconds, "notes": [[onset_quarter, pitch, pred_staff(1|2)]], "error": ...}}
The input is the printed score; include_original=False so no staff/voice truth is read (the model's note features are
duration-in-bar, pitch class and octave only: piano_svsep/utils/vocsep.py get_vocsep_features)."""
import sys, json, time, warnings, os
from pathlib import Path
warnings.simplefilter("ignore")
REPO = Path(__file__).resolve().parents[5] / "build/piano_svsep"
sys.path.insert(0, str(REPO))
sys.path.insert(0, str(REPO / "launch_scripts"))
import numpy as np
import torch
import torch_geometric as pyg
import partitura as pt
from piano_svsep.models.pl_models import PLPianoSVSep
from predict import prepare_score

CONTENT = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject/app/public/content")
items = json.load(open(sys.argv[1]))
if isinstance(items, dict):
    items = items["list"]
outp = sys.argv[2]
t0 = time.perf_counter()
model = PLPianoSVSep.load_from_checkpoint(str(REPO / "pretrained_models/model.ckpt"), map_location="cpu", strict=False, weights_only=False)
model.module.eval()
res = {"_load_seconds": round(time.perf_counter() - t0, 2)}
for it in items:
    k = it["id"]
    t1 = time.perf_counter()
    try:
        g, score, tied = prepare_score(str(CONTENT / it["file"]), include_original=False)
        b = pyg.data.Batch.from_data_list([g])
        with torch.no_grad():
            pv, ps, _ = model.predict_step(b, return_graph=True)
        na = score[0].note_array()
        ps = ps.detach().cpu().numpy().astype(int) + 1
        ids = na["id"]
        # note array of the score before assign_voices is in the same order as the model input
        rows = [[round(float(na["onset_quarter"][i]), 4), int(na["pitch"][i]), int(ps[i])] for i in range(len(na))]
        res[k] = {"t": round(time.perf_counter() - t1, 3), "notes": rows}
    except Exception as e:
        res[k] = {"t": round(time.perf_counter() - t1, 3), "error": f"{type(e).__name__}: {str(e)[:200]}"}
    json.dump(res, open(outp, "w"))
print("done", len(res) - 1)
