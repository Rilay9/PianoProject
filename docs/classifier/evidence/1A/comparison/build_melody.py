"""Assemble melody.md from melody_template.md and the generated fragments."""
import re
from mel_common import *

chord = (HERE / "frag_chord.md").read_text(encoding="utf-8")
parts = re.split(r"(?m)^### ", chord)
parts = [p for p in parts if p.strip()]
by = {p.split("\n", 1)[0]: "### " + p for p in parts}


def pick(*prefixes):
    return "\n".join(v for k, v in by.items() if any(k.startswith(p) for p in prefixes))


frags = {"frag_chord_parse.md": pick("Parse of `<harmony>`"), "frag_chord_text.md": pick("Parse of symbols typed as text", "Text candidates"),
         "frag_chord_role.md": pick("Role of the notes", "Generated items with symbols")}
t = (HERE / "melody_template.md").read_text(encoding="utf-8")


def sub(m):
    name = m.group(1)
    if name in frags:
        return frags[name]
    return (HERE / name).read_text(encoding="utf-8")


out = re.sub(r"\{\{([^}]+)\}\}", sub, t)
(HERE / "melody.md").write_text(out, encoding="utf-8")
print(len(out), "chars;", out.count("{{"), "unresolved")
