"""Assemble key.md from key_template.md and the fragments the metric scripts wrote (frag_*.md).
Each `{{frag_name}}` in the template is replaced by the file frag_name.md. Run after wir_metrics.py and cat_metrics.py."""
from cmp_common import *
import re

t = (HERE / "key_template.md").read_text(encoding="utf-8")
t = re.sub(r"\{\{(frag_[a-z_]+)\}\}", lambda m: (HERE / (m.group(1) + ".md")).read_text(encoding="utf-8").strip(), t)
(HERE / "key.md").write_text(t, encoding="utf-8")
print("key.md", len(t.splitlines()), "lines")
