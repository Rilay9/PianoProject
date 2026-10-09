"""Control for the MidiBERT checkpoint: the v2 branch's own prepared POP909 test tokens (Data/CP_data/pop909_test.npy, pop909_test_melans.npy, 6 fields)
through the same model loading as mb_run.py. If the checkpoint is the published one this should reproduce the paper's melody-task scores
(two-class melody vs non-melody accuracy 99.06, F1 98.70 on MidiBERT's Table 3; three-class 96.15). Writes mb_control.json.
Run in build/venv-midibert."""
import sys, json
import numpy as np
np.long = int; np.int = int
import torch
from pathlib import Path
sys.argv = [sys.argv[0], "x"]
import mb_run as R

WT = R.WT
X = np.load(WT / "build/midibert/repo_v2/Data/CP_data/pop909_test.npy", allow_pickle=True)
Y = np.load(WT / "build/midibert/repo_v2/Data/CP_data/pop909_test_melans.npy", allow_pickle=True)
model, e2w, ck = R.load_model()
pad = np.array([e2w[k][f"{k} <PAD>"] for k in e2w])
def reorder(x, y, mode):
    """mode 'asis': as prepared (within one position the notes keep the MIDI's track order: melody, bridge, piano);
    'pitch_asc': within one (bar, position) notes sorted by pitch token ascending, labels carried along (what a single-track MIDI sorted by pitch gives)."""
    if mode == "asis":
        return x, y
    x2, y2 = x.copy(), y.copy()
    for s in range(len(x)):
        n = int((y[s] != 0).sum())
        keys = list(zip(np.cumsum(x[s][:n, 0] == 1), x[s][:n, 1]))   # field 0 = Bar token (New/Continue), field 1 = Position
        order = sorted(range(n), key=lambda i: (keys[i], x[s][i, 2]))
        x2[s][:n] = x[s][:n][order]; y2[s][:n] = y[s][:n][order]
    return x2, y2


def evaluate(mode):
    Xm, Ym = reorder(X, Y, mode)
    preds, ys = [], []
    for i in range(0, len(Xm), 8):
        x = torch.tensor(Xm[i:i + 8], dtype=torch.long)
        attn = torch.tensor((Ym[i:i + 8] != 0).astype(np.float32))
        with torch.no_grad():
            o = model.forward(x, attn, -1)
        p = np.argmax(o.numpy(), axis=-1)
        m = Ym[i:i + 8] != 0
        preds.append(p[m]); ys.append(Ym[i:i + 8][m])
    return np.concatenate(preds), np.concatenate(ys)


p, y = evaluate("asis")
p_s, y_s = evaluate("pitch_asc")
def scores(pos_pred, pos_true):
    tp = int((pos_pred & pos_true).sum()); fp = int((pos_pred & ~pos_true).sum()); fn = int((~pos_pred & pos_true).sum()); tn = int((~pos_pred & ~pos_true).sum())
    P = tp / (tp + fp); Rr = tp / (tp + fn)
    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn, "accuracy": (tp + tn) / (tp + fp + fn + tn), "precision": P, "recall": Rr, "f1": 2 * P * Rr / (P + Rr)}

out = {"sequences": int(len(X)), "notes": int(len(y)), "label_values": sorted(set(int(v) for v in y)), "pred_values": sorted(set(int(v) for v in p)),
       "pred_counts": {int(v): int((p == v).sum()) for v in set(p)},
       "as_checkpoint_class1_only_is_melody": scores(p == 1, y == 1),
       "classes_1_and_2_are_melody_class3_accompaniment (3-class model: melody, bridge, accompaniment)": scores((p == 1) | (p == 2), y == 1),
       "within_position_order_by_pitch_ascending__classes_1_or_2": scores((p_s == 1) | (p_s == 2), y_s == 1),
       "within_position_order_by_pitch_ascending__class_1_only_vs_M_or_B_truth": scores(p_s == 1, y_s == 1),
       "checkpoint_epoch": ck.get("epoch"), "checkpoint_valid_acc": ck.get("valid_acc")}
(Path(__file__).with_name("mb_control.json")).write_text(json.dumps(out, indent=1, default=str), encoding="utf-8")
print(out)
