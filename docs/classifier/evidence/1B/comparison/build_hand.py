"""Assemble hand.md from hand_template.md, the frag_*.md files, hand_says.md and hand_rec.md."""
from pathlib import Path
H = Path(__file__).resolve().parent
t = (H / "hand_template.md").read_text(encoding="utf-8")
for key, f in (("{{HA}}", "frag_ha.md"), ("{{POS}}", "frag_pos.md"), ("{{NAMED}}", "frag_named.md"), ("{{SAYS}}", "hand_says.md"), ("{{REC}}", "hand_rec.md")):
    t = t.replace(key, (H / f).read_text(encoding="utf-8").strip())
(H / "hand.md").write_text(t, encoding="utf-8")
print(len(t))
