"""AugmentedNet inference for the key comparison: its local-key output (LocalKey38) per time step, from the pretrained
AugmentedNet.hdf5. Run with build/venv-augnet (tensorflow 2.15.1, music21 6.7.1), NOT the main .venv:

    C:/vaug/Scripts/python.exe -X utf8 docs/classifier/evidence/1B/comparison/augnet_run.py <manifest.json> <out.json>

(C:/vaug is a directory junction to build/venv-augnet: the worktree path is too long for TensorFlow's headers on Windows.)
manifest = [{"key": <id>, "path": <MusicXML path>}, ...].  The prediction code is inference.py `predict` up to the
dataframe of decoded outputs (the same calls, same order); the part after it (RomanText writing, annotated score) is left
out because only the key columns are used here. Per piece the output holds:
  by_number : {measure number (string): [pc, mode]}  the LocalKey38 at the first time step of that measure
  first     : the key at the first time step           mode : the most frequent key over all time steps
  seconds   : prediction time of the piece, model loading excluded
"""
import sys, os, json, time, warnings, traceback
from collections import Counter
from pathlib import Path
warnings.simplefilter("ignore")
AUG = Path(__file__).resolve().parents[5] / "build/augnet"
sys.path.insert(0, str(AUG))
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from AugmentedNet.score_parser import parseScore
from AugmentedNet.input_representations import available_representations as availableInputs
from AugmentedNet.output_representations import available_representations as availableOutputs
from AugmentedNet.utils import padToSequenceLength

PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def parse_key(label):
    base = PC[label[0].upper()]
    rest = label[1:]
    pc = (base + rest.count("#") - rest.count("-") - rest.count("b")) % 12
    return [pc, "major" if label[0].isupper() else "minor"]


def decode(model, path):
    df = parseScore(path)
    inputs = [l.name.rsplit("_")[1] for l in model.inputs]
    encodedInputs = [availableInputs[i](df) for i in inputs]
    outputLayers = [l.name.split("/")[0] for l in model.outputs]
    seqlen = model.inputs[0].shape[1]
    modelInputs = [padToSequenceLength(i.array, seqlen, value=-1) for i in encodedInputs]
    predictions = model.predict(modelInputs, verbose=0)
    predictions = [p.reshape(1, -1, p.shape[2]) for p in predictions]
    dfdict = {}
    for outputRepr, pred in zip(outputLayers, predictions):
        predOnehot = np.argmax(pred[0], axis=1).reshape(-1, 1)
        dfdict[outputRepr] = availableOutputs[outputRepr].decode(predOnehot)
    dfout = pd.DataFrame(dfdict)
    n = len(df.index)
    keys = dfout["LocalKey38"].values[:n]
    meas = df["s_measure"].values[:n]
    return keys, meas


if __name__ == "__main__":
    manifest = json.load(open(sys.argv[1]))
    model = keras.models.load_model(str(AUG / "AugmentedNet.hdf5"))
    out = {}
    for m in manifest:
        t = time.perf_counter()
        try:
            keys, meas = decode(model, m["path"])
            by = {}
            for k, ms in zip(keys, meas):
                by.setdefault(str(int(ms)), parse_key(k))
            cnt = Counter(keys)
            out[m["key"]] = {"by_number": by, "first": parse_key(keys[0]), "mode": parse_key(cnt.most_common(1)[0][0]),
                             "seconds": time.perf_counter() - t, "steps": len(keys)}
        except Exception as e:  # noqa
            out[m["key"]] = {"error": repr(e)[:300], "trace": traceback.format_exc()[-600:], "seconds": time.perf_counter() - t}
        print(m["key"], "error" in out[m["key"]] and out[m["key"]]["error"] or round(out[m["key"]]["seconds"], 1), flush=True)
        json.dump(out, open(sys.argv[2], "w"))
