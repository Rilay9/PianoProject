#!/usr/bin/env python3
"""Write `crossed-hands.mid`, the fixture that tells the two hand rules apart.

`two-hands.mid` beside this one cannot: its upper track is above its lower
track everywhere, so keeping the file's own tracks and splitting the notes by
voice-leading give the **same** two hands, and a test on it passes whichever
rule the converter follows.

This one is written so they disagree. Four bars of two tracks, both called
`Piano` — which is what the owner's downloaded arrangements carry, two note
tracks with one name between them:

* bars 1-2: an ordinary texture, the first track above the second;
* bars 3-4: **the left hand crosses over**. The second track takes the tune up
  at the top of the stave while the first track holds a figure below it.

So over the whole file the first track is not the higher of the two, and the
voice-leading split — which follows the *lines* and not the track numbering —
puts the bar 3-4 notes in the other hand from the one the arranger wrote them
for. Keeping the tracks as recorded is the rule that is right here, because a
person assigned those hands and the file is saying so.

Hand-written bytes rather than a rendering, for the reason
`tests/unit/midiParse.test.ts` gives: a fixture converted from something else
makes the test a test of that something else. Nothing here is played to, so
every onset is exactly on its beat and the conversion is arithmetic.

    python app/tests/fixtures/imports/make-crossed-hands-midi.py
"""
from pathlib import Path

TICKS = 480
MICROS_PER_QUARTER = 60_000_000 // 90  # 90 bpm


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


#: The first track in the file, which the converter must make the upper staff.
#: Bars 1-2 are a right hand; bars 3-4 sit in the middle of the piano, under
#: the second track.
FIRST = [
    (0.0, 1.0, 60), (1.0, 1.0, 62), (2.0, 1.0, 64), (3.0, 1.0, 65),
    (4.0, 1.0, 67), (5.0, 1.0, 65), (6.0, 1.0, 64), (7.0, 1.0, 62),
    (8.0, 2.0, 52), (10.0, 2.0, 55),
    (12.0, 4.0, 48),
]
#: The second track, which must be the lower staff even in bars 3-4, where it
#: is the highest thing sounding.
SECOND = [
    (0.0, 4.0, 48),
    (4.0, 4.0, 43),
    (8.0, 1.0, 81), (9.0, 1.0, 79), (10.0, 1.0, 76), (11.0, 1.0, 72),
    (12.0, 4.0, 79),
]


def main() -> None:
    # format 1, three tracks (a conductor and two called Piano), ticks per quarter
    header = chunk(b"MThd", (1).to_bytes(2, "big") + (3).to_bytes(2, "big")
                   + TICKS.to_bytes(2, "big"))
    conductor = track(
        [
            (0, b"\xff\x51\x03" + MICROS_PER_QUARTER.to_bytes(3, "big")),
            (0, b"\xff\x58\x04\x04\x02\x18\x08"),
        ],
        name="Conductor",
    )
    data = header + conductor + track(line(FIRST), "Piano") + track(line(SECOND), "Piano")
    out = Path(__file__).with_name("crossed-hands.mid")
    out.write_bytes(data)
    print(f"wrote {out} ({len(data)} bytes, "
          f"{len(FIRST)} + {len(SECOND)} notes on two tracks both called Piano)")


if __name__ == "__main__":
    main()
