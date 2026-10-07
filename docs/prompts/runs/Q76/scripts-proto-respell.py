"""
Prototype: the edition's own spelling onto the MIDI-derived score. The edition's pitches per staff, in order, come
from its .ly (python-ly's tokens after rel2abs, rhythm_explicit and the unfold); the converted score's notes per staff
in time order; the two pitch-class sequences are aligned (difflib), and every matched note takes the edition's letter
and accidental at its own sounding pitch. Reports how many notes matched and the spelled-name counts per staff that
still differ from the edition's.

    python scripts-proto-respell.py <edition .ly> <converted .musicxml> <out .musicxml> right,left
"""
import difflib
import importlib.util
import sys
import warnings
from collections import Counter
from pathlib import Path

warnings.filterwarnings("ignore")
HERE = Path(__file__).resolve()
spec = importlib.util.spec_from_file_location("proto", HERE.parent / "scripts-proto-unfold.py")
proto = importlib.util.module_from_spec(spec)
spec.loader.exec_module(proto)

import ly.document  # noqa: E402
import ly.lex.lilypond  # noqa: E402
import ly.pitch  # noqa: E402
from music21 import converter, pitch as m21pitch  # noqa: E402

LETTERS = "CDEFGAB"
NATURAL = [0, 2, 4, 5, 7, 9, 11]


def edition_pitches(text: str, variable: str) -> list[tuple[int, str, int]]:
    """(pitch class, letter, alter in semitones) for every note of one variable, chord members sorted by letter order."""
    start = text.index(f"\n{variable} = ")
    brace = text.index("{", start)
    doc = ly.document.Document(text)
    toks = proto.tokens(text)
    i = next(k for k, t in enumerate(toks) if t.pos == brace)
    end = toks[proto.braced(toks, i) - 1].end
    sub = ly.document.Document(text[brace:end])
    source = ly.document.Source(ly.document.Cursor(sub), True, tokens_with_position=True)
    out, chord = [], None
    previous: set = set()
    tied = False

    def emit(event: list) -> None:
        nonlocal previous, tied
        # a note tied from the one before it is that note held, not a new one to spell
        fresh = [e for e in event if not (tied and e in previous)]
        out.extend(sorted(fresh, key=lambda x: (x[0], x[1])))
        previous, tied = set(event), False

    for token in ly.pitch.PitchIterator(source).pitches():
        if isinstance(token, ly.lex.lilypond.ChordStart):
            chord = []
            continue
        if isinstance(token, ly.lex.lilypond.ChordEnd):
            emit(chord)
            chord = None
            continue
        if isinstance(token, ly.lex.lilypond.Tie):
            tied = True
            continue
        if isinstance(token, ly.pitch.Pitch):
            letter = LETTERS[token.note]
            alter = int(round(float(token.alter) * 2))
            entry = ((NATURAL[token.note] + alter) % 12, letter, alter)
            if chord is not None:
                chord.append(entry)
            else:
                emit([entry])
    return out


def converted_notes(part):
    rows = []
    for n in part.recurse().notes:
        if type(n).__name__ in ("ChordSymbol", "Harmony"):
            continue
        members = list(n.notes) if n.isChord else [n]
        off = n.getOffsetInHierarchy(part)
        for m in sorted(members, key=lambda x: (x.pitch.pitchClass, x.pitch.step)):
            # a tied continuation is not a new note in the edition's text; a chord's own tie speaks for members without one
            tie = m.tie
            if tie is not None and tie.type in ("stop", "continue"):
                continue
            rows.append((off, m))
    rows.sort(key=lambda r: (r[0], r[1].pitch.pitchClass))
    return [m for _o, m in rows]


def respell(note, letter, alter):
    midi = note.pitch.midi
    for octave in range(0, 9):
        p = m21pitch.Pitch(letter + {-2: "--", -1: "-", 0: "", 1: "#", 2: "##"}[alter] + str(octave))
        if p.midi == midi:
            note.pitch = p
            return True
    return False


if __name__ == "__main__":
    ly_path, xml_in, xml_out, variables = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]), sys.argv[4].split(",")
    text = proto.preprocess(ly_path.read_text(encoding="utf-8", errors="replace"))
    score = converter.parse(str(xml_in))
    for part, variable in zip(score.parts, variables):
        edition = edition_pitches(text, variable)
        notes = converted_notes(part)
        a = [e[0] for e in edition]
        b = [n.pitch.pitchClass for n in notes]
        matcher = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
        matched = filled = 0
        spelled = [False] * len(notes)
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == "equal":
                for k in range(i2 - i1):
                    _pc, letter, alter = edition[i1 + k]
                    spelled[j1 + k] = respell(notes[j1 + k], letter, alter)
                    matched += spelled[j1 + k]
            elif tag == "replace":
                # the gap's notes, paired in order by pitch class
                pool = list(range(i1, i2))
                for j in range(j1, j2):
                    hit = next((i for i in pool if edition[i][0] == b[j]), None)
                    if hit is not None:
                        pool.remove(hit)
                        spelled[j] = respell(notes[j], edition[hit][1], edition[hit][2])
                        filled += spelled[j]
        # a note left over takes the edition's spelling of its pitch class at the nearest spelled neighbour
        for j, done in enumerate(spelled):
            if done:
                continue
            for d in range(1, 64):
                near = [k for k in (j - d, j + d) if 0 <= k < len(notes) and spelled[k] and notes[k].pitch.pitchClass == b[j]]
                if near:
                    k = near[0]
                    spelled[j] = respell(notes[j], notes[k].pitch.step, int(notes[k].pitch.alter))
                    filled += spelled[j]
                    break
        # a tied continuation keeps its note's spelling
        held = {}
        for n in part.recurse().notes:
            for m in (list(n.notes) if n.isChord else [n]):
                if m.tie is not None and m.tie.type in ("stop", "continue") and m.pitch.midi in held:
                    step, alter = held[m.pitch.midi]
                    respell(m, step, alter)
                if m.tie is not None and m.tie.type in ("start", "continue"):
                    held[m.pitch.midi] = (m.pitch.step, int(m.pitch.alter))
        allowed = {}
        for pc, letter, alter in edition:
            allowed.setdefault(pc, set()).add((letter, alter))
        foreign = Counter(f"{n.pitch.step}{int(n.pitch.alter):+d}" for n in notes
                          if (n.pitch.step, int(n.pitch.alter)) not in allowed.get(n.pitch.pitchClass, set()))
        left = sum(1 for s in spelled if not s)
        print(f"{variable}: edition {len(edition)} notes, converted {len(notes)} note starts; matched in order {matched}, "
              f"paired in the gaps or from a neighbour {filled}, left with the converter's spelling {left}; "
              f"spellings the edition never uses for that pitch class: {dict(foreign)}")
    score.write("musicxml", fp=str(xml_out))
