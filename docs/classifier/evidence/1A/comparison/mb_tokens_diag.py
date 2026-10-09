"""Diagnostic: MidiBERT's own prepared POP909 test tokens (first sequence) against the tokens this comparison builds from song 011: duration and velocity tokens.
Run in build/venv-midibert; writes mb_tokens_diag.json."""
import sys, json, pickle, collections
import numpy as np
np.long = int; np.int = int
sys.argv = [sys.argv[0], "x"]
import mb_run as R
from pathlib import Path
e2w, w2e = pickle.load(open(R.DICT, "rb"))
X = np.load(R.WT / "build/midibert/repo_v2/Data/CP_data/pop909_test.npy", allow_pickle=True)
cp = R.CP(str(R.DICT))
words, keys = R.tokens_for(cp, R.SCORES / "011.mid")
theirs = [x for seq in X[:10] for x in seq if x[0] != e2w["Bar"]["Bar <PAD>"]]
dec = lambda row: [w2e[k][int(v)] for k, v in zip(e2w.keys(), row)]
out = {"theirs_first_rows": [dec(r) for r in X[0][:6]], "mine_first_rows": [dec(r) for r in words[:6]],
       "duration_token_top_theirs_first_10_sequences": collections.Counter(int(r[4]) for r in theirs).most_common(8),
       "duration_token_top_mine_song_011": collections.Counter(int(r[4]) for r in words).most_common(8),
       "note": "Duration token i means (i+1)*60 ticks at 480 ticks per quarter."}
Path(__file__).with_name("mb_tokens_diag.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
print(out["duration_token_top_theirs_first_10_sequences"], out["duration_token_top_mine_song_011"])
