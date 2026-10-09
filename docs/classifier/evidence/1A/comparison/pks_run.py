"""Stage 2: PKSpell on every note table written by sp_prepare.py. Runs in build/venv-pkspell (torch 2.14.1 CPU, numpy only for the
tables; no partitura, no music21), reached as C:/vpks (a directory junction: the worktree path is long).

    C:/vpks/Scripts/python.exe -X utf8 pks_run.py [limit]

Input to PKSpell, as its README states: a list of pitch classes (MIDI number mod 12) and a list of durations (quarter lengths),
notes in onset order (ties broken by pitch); it returns a tonal pitch class per note (e.g. 'A#', 'B-', 'D##') and a key signature
per note. The released weights are models/pkspell_statedict.pt of the repository (commit in pks_commit.txt). Output per piece:
build/sp_pks/<hash>.json {tpc, ks (both in the note table's order), seconds (model call only), n}. sp_pks.json collects the
seconds. Nothing about the written spelling is given to the model.
"""
import sys, json, time
from pathlib import Path
import numpy as np
import torch
torch.set_num_threads(2)

HERE = Path(__file__).resolve().parent
WT = HERE.parents[4]
PK = WT / "build/pkspell"
sys.path.insert(0, str(PK))
from src.models.models import PKSpell                       # noqa: E402
from src.models.inference import single_piece_predict       # noqa: E402

OUTD = WT / "build/sp_pks"; OUTD.mkdir(exist_ok=True)
IN = WT / "build/sp_in"


def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
    model = PKSpell()
    model.load_state_dict(torch.load(PK / "models/pkspell_statedict.pt"))
    model.eval()
    prep = json.load(open(HERE / "sp_prepare.json", encoding="utf8"))
    times = {}
    keys = [k for k, v in prep.items() if "hash" in v]
    if limit:
        keys = keys[:limit]
    errs = {}
    for n_done, k in enumerate(keys):
        hsh = prep[k]["hash"]
        f = OUTD / (hsh + ".json")
        if f.exists():
            times[k] = json.load(open(f))["seconds"]
            continue
        d = np.load(IN / (hsh + ".npz"))
        pitch = d["pitch"].astype(int); onset = d["onset_quarter"].astype(float); dur = d["duration_quarter"].astype(float)
        if len(pitch) == 0:
            json.dump({"tpc": [], "ks": [], "seconds": 0.0, "n": 0}, open(f, "w")); continue
        order = np.lexsort((pitch, onset))
        pcs = [int(x % 12) for x in pitch[order]]
        durs = [float(x) for x in dur[order]]
        try:
            t = time.perf_counter()
            tpc, ks = single_piece_predict(pcs, durs, model, "cpu")
            dt = time.perf_counter() - t
        except Exception as e:                                # noqa
            errs[k] = repr(e)[:200]
            continue
        tpc_o = [None] * len(order); ks_o = [None] * len(order)
        for pos, idx in enumerate(order):
            tpc_o[int(idx)] = tpc[pos]; ks_o[int(idx)] = int(ks[pos])
        json.dump({"tpc": tpc_o, "ks": ks_o, "seconds": round(dt, 4), "n": len(order)}, open(f, "w"))
        times[k] = round(dt, 4)
        if n_done % 200 == 0:
            print(n_done, len(keys), flush=True)
    json.dump({"seconds": times, "errors": errs, "torch": torch.__version__}, open(HERE / "sp_pks.json", "w"), indent=0)
    print("done", len(times), "errors", len(errs))
    for k, v in list(errs.items())[:10]:
        print(k, v)


if __name__ == "__main__":
    main()
