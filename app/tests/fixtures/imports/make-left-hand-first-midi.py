#!/usr/bin/env python3
"""Write `left-hand-first.mid`, the fixture for *the hands are the other way round* (X3).

Two note tracks, so the converter keeps them as recorded, in file order: the
first track becomes the upper staff (treble clef) and the second the lower
(bass clef) — `app/src/import/midi/convert.ts`'s rule, and the Python tool's.
Here the first track is the left hand's: a bass line between G2 and F3. So the
converted score puts the bass line on the treble staff, under a stack of ledger
lines, and the tune (E4 to C5) on the bass staff, over another. A learner who
opens it sees at once that the hands are the other way round, and that is the
correction the import sheet's *Swap the hands* makes: each staff keeps its clef
and its notes go to the other hand, after which neither staff needs a ledger
line.

No tempo event, on purpose: the file states no tempo, so the import sheet says
the app chose one and the Library says the tempo is not stated. Four bars of
C major, every onset exactly on its beat, so the conversion is arithmetic.
Hand-written bytes, for the reason `make-two-hands-midi.py` gives.

    python app/tests/fixtures/imports/make-left-hand-first-midi.py
"""
from pathlib import Path

TICKS = 480


def varlen(value: int) -> bytes:
    out = bytearray([value & 0x7F])
    value >>= 7
    while value:
        out.insert(0, (value & 0x7F) | 0x80)
        value >>= 7
    return bytes(out)


def chunk(name: bytes, body: bytes) -> bytes:
    return name + len(body).to_bytes(4, "big") + body


def track(events: list[tuple[int, bytes]], name: str | None = None) -> bytes:
    body = bytearray()
    if name is not None:
        body += varlen(0) + b"\xff\x03" + varlen(len(name)) + name.encode("latin-1")
    for delta, message in events:
        body += varlen(delta) + message
    body += varlen(0) + b"\xff\x2f\x00"
    return chunk(b"MTrk", bytes(body))


def line(notes: list[tuple[float, float, int]]) -> list[tuple[int, bytes]]:
    """(onset in quarters, length in quarters, MIDI number) as note-on/note-off pairs."""
    stamped: list[tuple[int, bytes]] = []
    for at, length, midi in notes:
        stamped.append((round(at * TICKS), bytes([0x90, midi, 72])))
        stamped.append((round((at + length) * TICKS), bytes([0x80, midi, 0])))
    stamped.sort(key=lambda pair: pair[0])
    out: list[tuple[int, bytes]] = []
    now = 0
    for when, message in stamped:
        out.append((when - now, message))
        now = when
    return out


# The bass line, G2 to F3: inside the bass staff, below the treble staff.
LEFT = [
    (0.0, 2.0, 48), (2.0, 2.0, 43),
    (4.0, 2.0, 45), (6.0, 2.0, 52),
    (8.0, 2.0, 53), (10.0, 2.0, 48),
    (12.0, 2.0, 43), (14.0, 2.0, 48),
]
# The tune, E4 to C5: inside the treble staff, above the bass staff.
RIGHT = [
    (0.0, 1.0, 64), (1.0, 1.0, 67), (2.0, 1.0, 72), (3.0, 1.0, 67),
    (4.0, 1.0, 69), (5.0, 1.0, 67), (6.0, 1.0, 64), (7.0, 1.0, 67),
    (8.0, 1.0, 65), (9.0, 1.0, 69), (10.0, 1.0, 67), (11.0, 1.0, 65),
    (12.0, 1.0, 67), (13.0, 1.0, 65), (14.0, 2.0, 64),
]


def main() -> None:
    # format 1, three tracks (a conductor with the metre and no tempo, then the
    # left hand first and the right hand second), ticks per quarter
    header = chunk(b"MThd", (1).to_bytes(2, "big") + (3).to_bytes(2, "big")
                   + TICKS.to_bytes(2, "big"))
    conductor = track([(0, b"\xff\x58\x04\x04\x02\x18\x08")], name="Conductor")
    data = header + conductor + track(line(LEFT), "Left hand") + track(line(RIGHT), "Right hand")
    out = Path(__file__).with_name("left-hand-first.mid")
    out.write_bytes(data)
    print(f"wrote {out} ({len(data)} bytes, {len(LEFT) + len(RIGHT)} notes on two tracks)")


if __name__ == "__main__":
    main()
