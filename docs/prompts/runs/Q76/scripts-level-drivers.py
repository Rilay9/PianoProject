"""The level model on given score files: the estimate, every feature's contribution, and the features' values."""
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parents[4] / "tools" / "content"))
import difficulty  # noqa: E402
from music21 import converter  # noqa: E402

model = difficulty.load_model()
for path in sys.argv[1:]:
    feats = difficulty.features(converter.parse(path))
    est = difficulty.estimate(feats, model)
    contrib = []
    for name in difficulty.FEATURE_NAMES:
        w = float(model.get("weights", {}).get(name, 0.0))
        if w:
            scaled = difficulty._log_scale(name, float(feats.get(name, 0.0))) - float(model.get("means", {}).get(name, 0.0))
            contrib.append((name, round(w * scaled, 3), round(float(feats.get(name, 0.0)), 3)))
    print(Path(path).name, "estimate", est.level, "bias", model.get("bias"))
    for name, c, v in sorted(contrib, key=lambda t: -abs(t[1])):
        print(f"   {name:18} {c:+.3f}  (value {v})")
