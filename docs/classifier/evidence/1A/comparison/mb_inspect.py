"""MidiBERT melody checkpoint vs the repo's code: shapes of the checkpoint against the model the repo builds (run in build/venv-midibert)."""
import sys, pickle, json
import numpy as np
np.long = int  # numpy 1.26 removed np.long, which MidiBERT/model.py uses
import torch
from pathlib import Path
WT = Path(__file__).resolve().parents[5]
REPO = WT / "build/midibert/repo"
sys.path.insert(0, str(REPO))
ck = torch.load(WT / "build/midibert/ckpt/melody_model_best.ckpt", map_location="cpu", weights_only=False)
print("top keys", list(ck.keys()))
sd = ck["state_dict"]
print("n tensors", len(sd))
shapes = {k: tuple(v.shape) for k, v in sd.items()}
for k in list(shapes)[:14]:
    print(k, shapes[k])
print("embedding tables:", {k: shapes[k] for k in shapes if "word_emb." in k})
from transformers import BertConfig
from MidiBERT.model import MidiBert
from MidiBERT.finetune_model import TokenClassification
e2w, w2e = pickle.load(open(REPO / "data_creation/prepare_data/dict/CP.pkl", "rb"))
cfg = BertConfig(max_position_embeddings=512, position_embedding_type="relative_key_query", hidden_size=768)
m = TokenClassification(MidiBert(bertConfig=cfg, e2w=e2w, w2e=w2e), 4, 768)
msd = m.state_dict()
mism = [(k, shapes.get(k), tuple(v.shape)) for k, v in msd.items() if k in shapes and shapes[k] != tuple(v.shape)]
print("repo model tensors", len(msd), "missing in ckpt", len([k for k in msd if k not in shapes]), "extra in ckpt", len([k for k in shapes if k not in msd]))
print("shape mismatches", mism[:10])
print("repo CP classes:", {k: len(v) for k, v in e2w.items()})
json.dump({"ckpt_tensors": len(sd), "model_tensors": len(msd), "mismatch": [[k, list(a) if a else None, list(b)] for k, a, b in mism],
           "extra_in_ckpt": [k for k in shapes if k not in msd][:20], "missing_in_ckpt": [k for k in msd if k not in shapes][:20]},
          open(Path(__file__).parent / "mb_inspect.json", "w"), indent=1)
