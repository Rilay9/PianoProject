"""G30's edit of tools/content/generate_exercises.py: the print step, and the 42 makers that return through it.

usage: python docs/prompts/runs/G30/scripts-edit_generator.py [--check]

Adds `print_as_contracted` after `finalize` and rewrites the final `return sc, entry` of each maker
whose family is in scripts-edit_contracts.FLIP to `return print_as_contracted(sc, entry)`. The maker
is found by its contract row's `maker`, the return by the AST (a statement of the function's own
body, never a nested helper's). Idempotent: the helper is added once, a rewritten return is left.
"""
from __future__ import annotations

import ast
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
PATH = ROOT / "tools" / "content" / "generate_exercises.py"
CONTRACTS = ROOT / "tools" / "content" / "family_contracts.json"

spec = importlib.util.spec_from_file_location("edit_contracts", Path(__file__).with_name("scripts-edit_contracts.py"))
edit_contracts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(edit_contracts)

ANCHOR = '''def finalize(sc: stream.Score) -> stream.Score:
    for p in sc.parts:
        p.makeMeasures(inPlace=True)
        p.makeTies(inPlace=True)
    return confirm_playable(confirm_not_silent(confirm_fingering(confirm(pad_final_bar(sc)))))
'''

HELPER = '''

def print_as_contracted(sc: stream.Score, entry: dict) -> tuple[stream.Score, dict]:
    """
    A family's fingering on the page only where its contract row prints it (G30).

    A finger number over a note is read as the fingering — "play this with 3" — whatever
    `fingeringVerified` says, and no screen reads the flag (G49, `make_broken_seventh`). Forty-two
    rows said their family's convention was the generator's own, "not a published source", and
    printed it all the same; the ruling is to print none until a source gives one
    (`docs/review/responses/questions-53670d2a.md` §3, held again in `questions-90b19bee.md` §1), and
    those rows now say `"printed": "none"`. Their makers still work the convention out — it is what a
    source would be checked against, and `confirm_fingering` still refuses an impossible chord of it —
    and return through here, which takes every printed finger off the score when the row says none.
    The physical gate then holds the written score to the row (`family_contracts.physical_faults`:
    "prints fingers and the row says none"), so a maker that skips this step stops the build. Notes,
    lengths and ties are untouched, so the item's music digest is the one it had
    (`family_contracts.music_digest` reads no articulation).
    """
    family = entry["drill"]["generator"]["family"]
    if family_contracts.contract(family)["physical"]["fingering"]["printed"] == "none":
        for n in sc.recurse().notes:
            n.articulations = [a for a in n.articulations if not isinstance(a, articulations.Fingering)]
            if isinstance(n, chord.Chord):
                # music21 exports nothing from a note inside a chord (`fingered_chord`); cleared all the same.
                for inner in n.notes:
                    inner.articulations = [a for a in inner.articulations if not isinstance(a, articulations.Fingering)]
    return sc, entry
'''

NEW_RETURN = "    return print_as_contracted(sc, entry)"


def main() -> None:
    raw = PATH.read_bytes()
    crlf = b"\r\n" in raw
    text = raw.decode("utf-8").replace("\r\n", "\n")
    changed = []
    if "def print_as_contracted(" not in text:
        assert text.count(ANCHOR) == 1
        text = text.replace(ANCHOR, ANCHOR + HELPER)
        changed.append("print_as_contracted added after finalize")
    contracts = json.loads(CONTRACTS.read_text(encoding="utf-8"))["families"]
    makers = {contracts[family]["maker"]: family for family in edit_contracts.FLIP}
    lines = text.split("\n")
    tree = ast.parse(text)
    for node in tree.body:
        if not isinstance(node, ast.FunctionDef) or node.name not in makers:
            continue
        last = node.body[-1]
        assert isinstance(last, ast.Return), node.name
        line = lines[last.lineno - 1]
        if line == NEW_RETURN:
            continue
        assert line == "    return sc, entry", (node.name, line)
        lines[last.lineno - 1] = NEW_RETURN
        changed.append(f"{node.name} ({makers[node.name]}) returns through print_as_contracted")
    found = {node.name for node in tree.body if isinstance(node, ast.FunctionDef)} & set(makers)
    assert found == set(makers), set(makers) - found
    text = "\n".join(lines)
    out = (text.replace("\n", "\r\n") if crlf else text).encode("utf-8")
    if "--check" in sys.argv:
        print("would change:" if out != raw else "nothing to change", *changed, sep="\n  ")
        return
    if out != raw:
        PATH.write_bytes(out)
    print(f"{len(changed)} edits", *changed, sep="\n  ")


if __name__ == "__main__":
    main()
