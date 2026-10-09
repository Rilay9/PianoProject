"""reading.accidental-kinds, the named items: the model's classes against the render (the validators' compare(), unchanged, from out/f2_named.json),
and the notes on which the model and the render differ."""
import json
from pathlib import Path
HERE = Path(__file__).resolve().parent
d = json.load(open(HERE / "out/f2_named.json", encoding="utf8"))
for i, r in d.items():
    m = r["model_vs_render"]
    e = r["emulation_vs_render"]
    c = r["confusion"]["conf"]
    print(i)
    print("   model vs render (validators' compare): agree", m.get("agree"), "disagree", m.get("disagree"), "unmatched", m.get("unmatched"), "by", m.get("by"), "examples", m.get("ex"))
    print("   emulation vs render (validators' run): agree", e.get("agree"), "mine_only", e.get("mine_only"), "osmd_only", e.get("osmd_only"))
    print("   uniform table (reader|has file accidental|reader shows|render draws): ", {k: v for k, v in c.items() if k.split("|")[1] == "file_acc"})
