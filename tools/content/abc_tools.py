"""
ABC helpers: the `%%pianopath` metadata header and a voice-layout fix.

The voice fix exists because music21 10.5 does not understand the *inline*
voice form that docs/03-content-pipeline.md §5 uses in its authoring example:

    [V:1] C D E G | G2 F2 |]
    [V:2] C,2 E,2 | G,,2 G,,2 |]

Parsing that gives one part with both voices concatenated and one empty part —
measured, not assumed. The equivalent block form, where each voice's music
follows its own `V:` header, parses correctly into two parts. Rather than
change the documented authoring convention (it is the readable one for a
two-hand piano part, since the hands stay side by side in the file), the
inline form is rewritten into the block form before music21 sees it.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

INLINE_VOICE = re.compile(r"^\[V:\s*([^\]\s]+)\s*\]\s*(.*)$")
VOICE_HEADER = re.compile(r"^V:\s*(\S+)\s*(.*)$")
PIANOPATH = re.compile(r"^%%pianopath\s+(.*)$")


@dataclass
class AbcMetadata:
    """Everything `%%pianopath` lines and the standard ABC headers carry."""

    fields: dict[str, str] = field(default_factory=dict)
    title: str | None = None
    composer: str | None = None
    tempo_bpm: float | None = None
    key: str | None = None
    meter: str | None = None

    def get(self, name: str, default: str | None = None) -> str | None:
        return self.fields.get(name, default)

    def list(self, name: str) -> list[str]:
        raw = self.fields.get(name, "")
        return [part.strip() for part in raw.split(",") if part.strip()]


def parse_metadata(text: str) -> AbcMetadata:
    """Reads `%%pianopath key=value` lines plus T:/C:/Q:/K:/M: headers."""
    meta = AbcMetadata()
    for line in text.splitlines():
        stripped = line.strip()
        match = PIANOPATH.match(stripped)
        if match:
            for token in tokenize_pairs(match.group(1)):
                key, _, value = token.partition("=")
                if value:
                    meta.fields[key.strip()] = value.strip()
            continue
        if stripped.startswith("T:") and meta.title is None:
            meta.title = stripped[2:].strip()
        elif stripped.startswith("C:") and meta.composer is None:
            meta.composer = stripped[2:].strip()
        elif stripped.startswith("K:") and meta.key is None:
            meta.key = stripped[2:].strip()
        elif stripped.startswith("M:") and meta.meter is None:
            meta.meter = stripped[2:].strip()
        elif stripped.startswith("Q:") and meta.tempo_bpm is None:
            meta.tempo_bpm = parse_tempo(stripped[2:].strip())
    return meta


def tokenize_pairs(text: str) -> list[str]:
    """Splits `a=1 b="two words" c=3` on spaces outside quotes."""
    tokens: list[str] = []
    current: list[str] = []
    quoted = False
    for char in text:
        if char == '"':
            quoted = not quoted
            continue
        if char.isspace() and not quoted:
            if current:
                tokens.append("".join(current))
                current = []
            continue
        current.append(char)
    if current:
        tokens.append("".join(current))
    return tokens


def parse_tempo(text: str) -> float | None:
    """`1/4=84`, `84`, or `C=84` → 84.0 quarter-note bpm where it is expressible."""
    text = text.strip()
    match = re.match(r"^(?:(\d+)/(\d+)\s*=\s*)?(\d+(?:\.\d+)?)$", text)
    if not match:
        return None
    numerator, denominator, bpm = match.groups()
    value = float(bpm)
    if numerator and denominator:
        # Convert "beats of this length per minute" to quarter-note bpm.
        beat_in_quarters = 4.0 * int(numerator) / int(denominator)
        return round(value * beat_in_quarters, 3)
    return value


def inline_voices_to_blocks(text: str) -> str:
    """
    Rewrites `[V:n] music` lines into per-voice blocks music21 can parse.

    Voice attributes from a standalone `V:n clef=bass` declaration are carried
    onto the emitted header, because that is where the clef comes from and a
    grand staff with two treble clefs is not a grand staff.
    """
    lines = text.splitlines()
    if not any(INLINE_VOICE.match(line.strip()) for line in lines):
        return text

    attributes: dict[str, str] = {}
    order: list[str] = []
    bodies: dict[str, list[str]] = {}
    head: list[str] = []
    seen_inline = False

    for line in lines:
        stripped = line.strip()
        inline = INLINE_VOICE.match(stripped)
        if inline:
            seen_inline = True
            voice, music = inline.group(1), inline.group(2)
            if voice not in bodies:
                bodies[voice] = []
                order.append(voice)
            if music.strip():
                bodies[voice].append(music.rstrip())
            continue
        header = VOICE_HEADER.match(stripped)
        if header and not seen_inline:
            voice, rest = header.group(1), header.group(2).strip()
            attributes[voice] = rest
            # The declaration itself is re-emitted with the body below.
            continue
        if seen_inline:
            # Trailing lines after the voices (rare) are appended to the last voice.
            if stripped and order:
                bodies[order[-1]].append(line.rstrip())
            continue
        head.append(line.rstrip())

    out = list(head)
    for voice in order:
        suffix = f" {attributes[voice]}" if attributes.get(voice) else ""
        out.append(f"V:{voice}{suffix}")
        out.extend(bodies[voice])
    return "\n".join(out) + "\n"


def strip_pianopath(text: str) -> str:
    """Removes `%%pianopath` lines; music21 ignores them but they add noise."""
    return "\n".join(line for line in text.splitlines() if not PIANOPATH.match(line.strip())) + "\n"


def prepare_abc(text: str) -> str:
    """Everything an ABC source needs before music21 sees it."""
    return inline_voices_to_blocks(strip_pianopath(text))


# ---------------------------------------------------------------------------
# fingering
# ---------------------------------------------------------------------------

#: music21 10.5 parses ABC decorations (`!1!`) and then discards them, so the
#: fingering docs/03 §5 asks authors to write would never reach the score.
#: These two functions put it back: the ABC body is scanned for note events in
#: order, and the fingerings are attached to the parsed notes by position.
_NOTE_LETTER = "ABCDEFGabcdefg"
_ACCIDENTALS = "^_="
_REST_LETTER = "zZxX"


def extract_fingerings(text: str) -> dict[str, dict[int, int]]:
    """
    `{voice: {note_index: finger}}` for every `!n!` in the body.

    Note index counts note *events* — a chord `[CEG]` is one — which is the
    same order music21 yields from `part.recurse().notes`.
    """
    prepared = inline_voices_to_blocks(strip_pianopath(text))
    out: dict[str, dict[int, int]] = {}
    voice = "1"
    index = 0
    pending: int | None = None
    in_body = False

    for line in prepared.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("%"):
            continue
        header = VOICE_HEADER.match(stripped)
        if header:
            voice = header.group(1)
            index = 0
            pending = None
            in_body = True
            continue
        if re.match(r"^[A-Za-z]:", stripped):
            # Any other `X:`-style header line. K: is the last one before music.
            in_body = in_body or stripped.startswith("K:")
            continue
        if not in_body:
            continue

        position = 0
        while position < len(stripped):
            char = stripped[position]
            if char == "!":
                end = stripped.find("!", position + 1)
                if end == -1:
                    break
                token = stripped[position + 1 : end]
                if token.isdigit() and 1 <= int(token) <= 5:
                    pending = int(token)
                position = end + 1
                continue
            if char == '"':
                end = stripped.find('"', position + 1)
                position = len(stripped) if end == -1 else end + 1
                continue
            if char == "{":
                # Grace notes are not indexed: music21 attaches them to the
                # following note rather than yielding them in sequence.
                end = stripped.find("}", position + 1)
                position = len(stripped) if end == -1 else end + 1
                continue
            if char == "[":
                # A chord is one event; `[V:1]` was already rewritten away.
                end = stripped.find("]", position + 1)
                if end == -1:
                    break
                if pending is not None:
                    out.setdefault(voice, {})[index] = pending
                    pending = None
                index += 1
                position = end + 1
                continue
            if char in _NOTE_LETTER or (char in _ACCIDENTALS and position + 1 < len(stripped)):
                if char in _ACCIDENTALS:
                    position += 1
                    while position < len(stripped) and stripped[position] in _ACCIDENTALS:
                        position += 1
                    if position >= len(stripped) or stripped[position] not in _NOTE_LETTER:
                        continue
                if pending is not None:
                    out.setdefault(voice, {})[index] = pending
                    pending = None
                index += 1
                position += 1
                continue
            if char in _REST_LETTER:
                # Rests are events in the bar but not in `part.notes`.
                position += 1
                continue
            position += 1

    return out


def playable_notes(part) -> list:
    """
    The notes a fingering can attach to.

    `part.recurse().notes` also yields `ChordSymbol` objects — a chord symbol is
    a Chord subclass in music21 — which shifted every fingering in a lead sheet
    by one per symbol before this filter existed.
    """
    from music21 import harmony

    return [n for n in part.recurse().notes if not isinstance(n, harmony.Harmony)]


def apply_fingerings(score, mapping: dict[str, dict[int, int]]) -> int:
    """Attaches the extracted fingerings to a parsed score. Returns the count."""
    from music21 import articulations

    parts = list(score.parts)
    applied = 0
    for order, (voice, fingers) in enumerate(sorted(mapping.items())):
        # By voice number, not by position in the mapping: a left-hand-only
        # tune marks fingering on voice 2 alone, and enumerating would have
        # put it on the (silent) treble staff — which is exactly what happened.
        index = int(voice) - 1 if voice.isdigit() else order
        if not 0 <= index < len(parts):
            continue
        notes = playable_notes(parts[index])
        for index, finger in fingers.items():
            if index < len(notes):
                notes[index].articulations.append(articulations.Fingering(finger))
                applied += 1
    return applied
