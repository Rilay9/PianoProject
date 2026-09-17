"""
A twelve-bar blues in D: shuffle bass under seventh chords.

Written as a module rather than in ABC because the point of the exercise is the
*pattern* -- the same shuffle figure moved onto each chord of the form -- and
saying that in code is shorter and less error-prone than typing out forty-eight
bars of ABC. The builder lives in tools/content/blues_forms.py so that the
keys stay identical in everything but the key.

D is here because the `jam` module names E, A, G and D as the keys a guitarist
calls, and it was the one of the four with no shuffle to play. The rung's five
"songs" are these files, so a jam key without one is a key the module can talk
about and not play in.
"""
from __future__ import annotations

from blues_forms import build_twelve_bar
from music21 import stream

PIANOPATH = {
    "id": "exercise.blues.twelve-bar-shuffle.d",
    "title": "Twelve-bar blues shuffle in D",
    "level": 4.1,
    "hands": "both",
    "tracks": "blues-boogie,improv-compose",
    "concepts": "12-bar-blues,shuffle,dominant-7th,I-IV-V",
    "license": "CC0",
    "genre": "blues",
    "tempoBpm": 88,
    "abrsm": 2,
}


def build() -> stream.Score:
    return build_twelve_bar("D", PIANOPATH["tempoBpm"])
