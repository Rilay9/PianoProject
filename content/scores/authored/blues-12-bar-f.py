"""
A twelve-bar blues in F: shuffle bass under seventh chords.

Written as a module rather than in ABC because the point of the exercise is the
*pattern* -- the same shuffle figure moved onto each chord of the form -- and
saying that in code is shorter and less error-prone than typing out forty-eight
bars of ABC. The builder lives in tools/content/blues_forms.py so that the
three keys stay identical in everything but the key.

docs/02-curriculum.md Part D's blues ladder: the left hand alone, then hands
together, then the same shape in F and G.
"""
from __future__ import annotations

from blues_forms import build_twelve_bar
from music21 import stream

PIANOPATH = {
    "id": "exercise.blues.twelve-bar-shuffle.f",
    "title": "Twelve-bar blues shuffle in F",
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
    return build_twelve_bar("F", PIANOPATH["tempoBpm"])
