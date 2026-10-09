"""Simonetta et al. 2019 melody CNN, run from a Python 3 port of the authors' code (build/simonetta/repo3, a 2to3 copy of
github.com/LIMUNIMI/Symbolic-Melody-Identification, MIT) on Theano 1.0.5 + Lasagne 0.2.dev1 in build/venv-simonetta (pure-Python Theano: no C++ compiler).

Run with cwd = build/simonetta/repo3 and THEANO_FLAGS="blas.ldflags=,cxx=" (see sim_run_pop.py). `load_model(kernels)` mirrors terminal_client.rebuild
(trainer.build_CNN_model on cnn_parameters.json, then set_params with the pickled kernels, read as a Python 2 pickle: encoding='latin1');
`label_notes(model, note_array)` mirrors terminal_client.extract_solo_part up to the labels: pianoroll_utils.make_pianorolls ->
misc_tools.split_windows -> window-wise predict -> misc_tools.recreate_pianorolls -> graph_tools.predict_labels (label 1 = melody).
"""
import sys, json, pickle, time
import numpy as np
from pathlib import Path

REPO3 = Path(__file__).resolve().parents[5] / "build/simonetta/repo3"
sys.path.insert(0, str(REPO3))
from melody_extractor import trainer, settings, misc_tools, graph_tools   # noqa: E402
from utils import pianoroll_utils                                          # noqa: E402
settings.OVERLAP = True      # terminal_client.main sets this for the CNN (no --rnn)
settings.MODEL_TYPE = "cnn"


def load_model(kernels_file):
    params = json.load(open(REPO3 / "cnn_parameters.json"))
    net = trainer.build_CNN_model(params)
    kernels = pickle.load(open(REPO3 / kernels_file, "rb"), encoding="latin1")
    net.set_params(kernels)
    return net


NOTE_DTYPE = [("pitch", "<i4"), ("onset", "<f4"), ("duration", "<f4"), ("soprano", "<i4")]


def make_note_array(pitch, onset, dur, soprano):
    a = np.zeros(len(pitch), dtype=NOTE_DTYPE)
    a["pitch"], a["onset"], a["duration"], a["soprano"] = pitch, onset, dur, soprano
    return a


def label_notes(net, note_array):
    pianoroll, melody, notelist, _nm = pianoroll_utils.make_pianorolls(note_array, output_idxs=True)
    win = net.win_width
    pr_windows = misc_tools.split_windows(pianoroll, win, settings.OVERLAP)
    pred = []
    for w in pr_windows:
        r = w[np.newaxis, np.newaxis].astype(settings.floatX)
        pred.append(net.predict(r)[0, 0])
    pred = np.array(pred)[:, np.newaxis, :, :]
    out = misc_tools.recreate_pianorolls(pred, settings.OVERLAP)
    true_labels, predicted = graph_tools.predict_labels(out, notelist)
    return np.asarray(predicted), np.asarray(true_labels), notelist
