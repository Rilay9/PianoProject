"""Assemble spelling.md from spelling_template.md and the frag_*.md files (replaces {{name}} with frag_<name>.md)."""
import re
from pathlib import Path
HERE = Path(__file__).resolve().parent
t = (HERE / "spelling_template.md").read_text(encoding="utf8")


def rep(m):
    f = HERE / f"frag_{m.group(1)}.md"
    if not f.exists():
        raise SystemExit(f"missing fragment {f.name}")
    return f.read_text(encoding="utf8").rstrip() + "\n"


out = re.sub(r"\{\{([A-Za-z0-9_]+)\}\}", rep, t)
(HERE / "spelling.md").write_text(out, encoding="utf8")
print("spelling.md", len(out.splitlines()), "lines")
