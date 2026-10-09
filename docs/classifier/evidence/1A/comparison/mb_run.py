"""MidiBERT-Piano v2 (6-field CP; the maintainers' re-uploaded melody checkpoint) on the POP909 test songs, and the MidiBERT repo's own skyline.

Run in build/venv-midibert:  C:/vmb/Scripts/python.exe -X utf8 docs/classifier/evidence/1A/comparison/mb_run.py
Code: build/midibert/repo_v2 (branch v2 of github.com/wazenmai/MIDI-BERT, MIT) -- data_creation/prepare_data/model.py CP (6 fields:
Bar, Position, Pitch, Velocity, Duration, Tempo; CP dict from the same branch), MidiBERT/model.py MidiBert_CP, finetune_model.py
TokenClassification(class_num=4). Checkpoint: build/midibert/ckpt/melody_model_best.ckpt (public Drive folder given in the repo's issue 18).
The checkpoint is a 3-class model (1 melody, 2 bridge, 3 accompaniment; verified in mb_control.py on the branch's own test tokens): "idx" = class 1, "idx_bridge" = class 2.
Input = the same single-track MIDI built from the same quantised notes every other method sees (pop_build.py), with POP909's own velocities.
Skyline = the repo's melody_extraction/skyline/analyzer.extract_melody (notes below MIDI 60 excluded, 8th-note quantisation, the highest note per start).
Writes pop_mb_results.json: {song: {"midibert": {"idx", "seconds"}, "skyline_repo": {"idx", "seconds"}}} with note indices into <song>.truth.json.
"""
import sys, time, pickle, json
import numpy as np
np.long = int; np.int = int   # numpy 1.26 removed these aliases, which the repo's code uses
import torch
from pathlib import Path
WT = Path(__file__).resolve().parents[5]
REPO = WT / "build/midibert/repo_v2"
sys.path.insert(0, str(REPO)); sys.path.insert(0, str(REPO / "melody_extraction/skyline"))
from transformers import BertConfig
from data_creation.prepare_data.model import CP
from MidiBERT.model import MidiBert_CP
from MidiBERT.finetune_model import TokenClassification
import analyzer as SKY

SCORES = WT / "build/pop909/scores"
DICT = REPO / "data_creation/prepare_data/dict/CP.pkl"


def load_model():
    e2w, w2e = pickle.load(open(DICT, "rb"))
    cfg = BertConfig(max_position_embeddings=512, position_embedding_type="relative_key_query", hidden_size=768)
    m = TokenClassification(MidiBert_CP(bertConfig=cfg, e2w=e2w, w2e=w2e), 4, 768)
    ck = torch.load(WT / "build/midibert/ckpt/melody_model_best.ckpt", map_location="cpu", weights_only=False, mmap=True)
    r = m.load_state_dict(ck["state_dict"], strict=False)   # transformers 4.40 keeps position_ids out of the state dict
    assert not r.missing_keys and r.unexpected_keys == ["midibert.bert.embeddings.position_ids"], (r.missing_keys, r.unexpected_keys)
    m.eval()
    return m, e2w, ck


def tokens_for(cp, path):
    events = cp.extract_events(str(path), "")
    words, keys = [], []
    for tup in events:
        nts, t0, pv = [], None, None
        for e in tup:
            if e.name == "Pitch":
                if e.value < 22: e.value = 22
                if e.value >= 108: e.value = 107
                pv = e.value; t0 = e.time
            nts.append(cp.event2word[e.name]["{} {}".format(e.name, e.value)])
        words.append(nts); keys.append((int(t0) // 120, int(pv)))
    return words, keys


def predict(model, cp, words):
    pad = cp.pad_word
    out = []
    for i in range(0, len(words), 512):
        chunk = words[i:i + 512]
        n = len(chunk)
        chunk = chunk + [pad] * (512 - n)
        x = torch.tensor(np.array([chunk]), dtype=torch.long)
        attn = torch.all(x != torch.tensor(pad), dim=2).float()
        with torch.no_grad():
            y = model.forward(x, attn, -1)
        out += list(np.argmax(y.numpy(), axis=-1)[0][:n])
    return out


class N:
    def __init__(self, i, s, e, v, p):
        self.start, self.end, self.velocity, self.pitch, self.idx = s, e, v, p, i


def main():
    """usage: mb_run.py pop|moz|chord   (resumable: the results file is rewritten after every piece, pieces done are skipped).
    Order: every 2nd piece first (pop), every 3rd first (moz), so any prefix of the run is a systematic subsample, not the first songs by number."""
    which = sys.argv[1]
    model, e2w, ck = load_model()
    cp = CP(str(DICT))
    if which == "pop":
        d, ext, stride = SCORES, ".mid", 2
        names = sorted(p.stem for p in d.glob("*.mid"))
        notes_of = lambda s: json.loads((d / f"{s}.truth.json").read_text(encoding="utf-8"))["notes"]
        tick = lambda n: (n["on"] * 120, (n["on"] + n["dur"]) * 120, n.get("vel", 64), n["on"])
        outname = "pop_mb_results.json"
    elif which == "moz":
        d, stride = WT / "build/mozart", 3
        names = sorted(p.name[:-len(".truth.json")] for p in d.glob("*.truth.json"))
        notes_of = lambda s: json.loads((d / f"{s}.truth.json").read_text(encoding="utf-8"))["notes"]
        outname = "moz_mb_results.json"
    else:
        d, stride = WT / "build/chord", 1
        names = sorted(p.name[:-len(".notes.json")] for p in d.glob("*.notes.json"))
        notes_of = lambda s: json.loads((d / f"{s}.notes.json").read_text(encoding="utf-8"))["notes"]
        outname = "chord_mb_results.json"
    order = [n for k in range(stride) for n in names[k::stride]]
    outp = Path(__file__).with_name(outname)
    res = json.loads(outp.read_text(encoding="utf-8")) if outp.exists() else {}
    for s in order:
        if s in res:
            continue
        notes = notes_of(s)
        midi = (d / f"{s}.mid")
        t0 = min(n["on"] for n in notes)
        # tick of each note in the MIDI file written by the builder
        if which == "pop":
            tk = lambda n: n["on"] * 120
        else:
            tk = lambda n: int(round((n["on"] - t0) * 480))
        key_to_idx = {}
        for i, n in enumerate(notes):
            key_to_idx.setdefault((int(round(tk(n) / 120)), min(max(n["pitch"], 22), 107)), i)
        t = time.time()
        words, keys = tokens_for(cp, midi)
        pred = predict(model, cp, words)
        dt = time.time() - t
        idx = sorted(key_to_idx[k] for k, c in zip(keys, pred) if c == 1 and k in key_to_idx)
        idx_bridge = sorted(key_to_idx[k] for k, c in zip(keys, pred) if c == 2 and k in key_to_idx)
        unmapped = sum(1 for k in keys if k not in key_to_idx)
        r = {"midibert": {"idx": idx, "idx_bridge": idx_bridge, "seconds": dt, "events": len(keys), "unmapped": unmapped, "notes": len(notes), "classes": sorted(set(int(c) for c in pred))}}
        if which == "pop":
            t = time.time()
            objs = [N(i, n["on"] * 120, (n["on"] + n["dur"]) * 120, n["vel"], n["pitch"]) for i, n in enumerate(notes)]
            sk = SKY.extract_melody(objs)
            r["skyline_repo"] = {"idx": sorted(o.idx for o in sk), "seconds": time.time() - t}
        res[s] = r
        outp.write_text(json.dumps(res), encoding="utf-8")
        print(s, len(notes), len(idx), f"{dt:.1f}s unmapped {unmapped}", flush=True)


if __name__ == "__main__":
    main()
