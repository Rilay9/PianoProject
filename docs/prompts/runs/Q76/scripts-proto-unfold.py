"""
Prototype: python-ly's own rel2abs and rhythm_explicit, then every \\repeat unfolded (the body once per
pass, each pass followed by its alternative), then python-ly's writer and convert.py's normalisation.
Prints per rag whether it converts, its bars, and python-ly's structure warnings.
"""
import re
import sys
import traceback
from pathlib import Path

HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parents[4] / "tools" / "content"))

import ly.document  # noqa: E402
import ly.lex  # noqa: E402
import ly.lex.lilypond  # noqa: E402
import ly.pitch.rel2abs  # noqa: E402
import ly.rhythm  # noqa: E402


def version_of(text):
    m = re.search(r'\\version\s+"(\d+)\.(\d+)', text)
    return (int(m.group(1)), int(m.group(2))) if m else (2, 0)


def tokens(text):
    doc = ly.document.Document(text)
    src = ly.document.Source(ly.document.Cursor(doc), True, tokens_with_position=True)
    return [t for t in src]


def skip_space(toks, i):
    while i < len(toks) and isinstance(toks[i], (ly.lex.Space, ly.lex.Comment)):
        i += 1
    return i


def braced(toks, i):
    """toks[i] is '{': the index after the matching '}'."""
    assert toks[i] == "{", (toks[i], i)
    depth = 0
    while i < len(toks):
        if toks[i] == "{":
            depth += 1
        elif toks[i] == "}":
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    raise ValueError("unbalanced braces")


def unfold_once(text):
    """Unfold the first \\repeat that holds no other \\repeat; None when none is left."""
    toks = tokens(text)
    starts = [i for i, t in enumerate(toks) if t == "\\repeat"]
    for i in reversed(starts):  # innermost last-started first
        j = skip_space(toks, i + 1)
        kind = str(toks[j])
        j = skip_space(toks, j + 1)
        count = int(str(toks[j]))
        j = skip_space(toks, j + 1)
        if toks[j] != "{":
            raise ValueError(f"\\repeat {kind} {count} not followed by a braced body")
        body_end = braced(toks, j)
        body = text[toks[j].pos:toks[body_end - 1].end]
        end = toks[body_end - 1].end
        alts = []
        k = skip_space(toks, body_end)
        if k < len(toks) and toks[k] == "\\alternative":
            k = skip_space(toks, k + 1)
            outer_end = braced(toks, k)
            m = skip_space(toks, k + 1)
            while m < outer_end - 1:
                alt_end = braced(toks, m)
                alts.append(text[toks[m].pos:toks[alt_end - 1].end])
                m = skip_space(toks, alt_end)
            end = toks[outer_end - 1].end
        if kind == "tremolo":
            continue
        passes = []
        for p in range(count):
            passes.append(body)
            if alts:
                passes.append(alts[max(0, p - (count - len(alts)))])
        return text[:toks[i].pos] + "{ " + " ".join(passes) + " }" + text[end:]
    return None


def preprocess(text):
    first_abs = version_of(text) >= (2, 18)
    doc = ly.document.Document(text)
    ly.pitch.rel2abs.rel2abs(ly.document.Cursor(doc), first_pitch_absolute=first_abs)
    doc2 = ly.document.Document(doc.plaintext())
    ly.rhythm.rhythm_explicit(ly.document.Cursor(doc2))
    out = doc2.plaintext()
    while True:
        nxt = unfold_once(out)
        if nxt is None:
            return out
        out = nxt


if __name__ == "__main__":
    import convert

    root, outdir = Path(sys.argv[1]), Path(sys.argv[2])
    outdir.mkdir(parents=True, exist_ok=True)
    for rel in sys.argv[3:]:
        src = root / rel
        try:
            pre = preprocess(src.read_text(encoding="utf-8", errors="replace"))
        except Exception:  # noqa: BLE001
            print("== PREPROCESS FAILED", rel)
            traceback.print_exc(limit=-3, file=sys.stdout)
            continue
        mid = outdir / (src.stem + ".pre.ly")
        mid.write_text(pre, encoding="utf-8")
        try:
            r = convert.convert_file(mid, outdir / (src.stem + ".mxl"))
            print(f"OK {rel}: {r.measures} bars, {r.note_events} note events, staves {r.staves}, warnings {r.warnings}")
        except Exception as exc:  # noqa: BLE001
            print(f"== CONVERT FAILED {rel}: {type(exc).__name__}: {str(exc)[:200]}")
