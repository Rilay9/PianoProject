#!/usr/bin/env python3
"""Write `two-hands.mid`, the fixture the MIDI import spec picks (T29).

Hand-written bytes rather than a rendering, for the reason
`tests/unit/midiParse.test.ts` gives: a fixture converted from something else
makes the test a test of that something else. This file is four bars of C
major, a right-hand line over held left-hand notes, on **two tracks** — because
a track per hand is what a file downloaded from the web carries, and merging
those into one line before splitting the hands is the thing the app does that
the command-line converter does not.

Nothing here is played to; every onset is exactly on its beat, so the
conversion is arithmetic and the spec is stable.

    python app/tests/fixtures/imports/make-two-hands-midi.py
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


RIGHT = [
    (0.0, 1.0, 60), (1.0, 1.0, 62), (2.0, 1.0, 64), (3.0, 1.0, 65),
    (4.0, 1.0, 67), (5.0, 1.0, 65), (6.0, 1.0, 64), (7.0, 1.0, 62),
    (8.0, 2.0, 60), (10.0, 2.0, 64),
    (12.0, 4.0, 67),
]
LEFT = [
    (0.0, 4.0, 48),
    (4.0, 4.0, 43),
    (8.0, 2.0, 48), (10.0, 2.0, 52),
    (12.0, 4.0, 48),
]


def main() -> None:
    # format 1, three tracks (a conductor and one per hand), ticks per quarter
    header = chunk(b"MThd", (1).to_bytes(2, "big") + (3).to_bytes(2, "big")
                   + TICKS.to_bytes(2, "big"))
    conductor = track(
        [
            (0, b"\xff\x51\x03" + MICROS_PER_QUARTER.to_bytes(3, "big")),
            (0, b"\xff\x58\x04\x04\x02\x18\x08"),
        ],
        name="Conductor",
    )
    data = header + conductor + track(line(RIGHT), "Right hand") + track(line(LEFT), "Left hand")
    out = Path(__file__).with_name("two-hands.mid")
    out.write_bytes(data)
    print(f"wrote {out} ({len(data)} bytes, {len(RIGHT) + len(LEFT)} notes on two tracks)")


if __name__ == "__main__":
    main()
