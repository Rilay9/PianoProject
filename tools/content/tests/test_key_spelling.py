"""
The shared spelling policy keeps the key's own notes and the chord's own tones (D0a; G50).

The reviewer's required change on D0 (`docs/review/responses/0669117.md`): `UNWRITTEN` named the
four white keys that can wear an accidental, and `_readable` respelled every one of them in every
key, so the ii-V-I in F-sharp major printed F where its C-sharp 7 and F-sharp major 7 have E-sharp:
the wrong degree under six sharps, with the right sound. `_readable` now keeps a spelling the key or
the chord gave, and respells only a double accidental and the root of a borrowed chord; its
docstring states the rule. What this file holds, read back from the written files where the page is
the question:

- **F-sharp major.** The plan's F-sharp harmony items (the seventh voicings, the ii-V-I trio and the
  four-chord loops) written out and read back: every note is a degree of F-sharp major spelled as
  the key spells it, E-sharp is in each, and no F natural sits under the six sharps. The plan has no
  cadence in F-sharp: `make_cadence` runs over `MAJOR_KEYS`, which spell that key G-flat, and its
  chords come from the key signature (`scale_pitches`), not through the policy.
- **G-flat major and the other six flats.** The plan spells its harmony keys F-sharp for G-flat
  (`HARMONY_KEYS`), so the same three makers are built in G-flat here, written and read back: C-flat
  is the key's fourth, A-flat minor 7's third and D-flat 7's seventh. Every shipped item engraved
  under six sharps or six flats (the F-sharp harmony above; G-flat major's scales, arpeggios,
  inversions, five-finger patterns and cadences; E-flat minor's, among them the quartal voicing,
  whose iv holds the key's C-flat) writes the key's own note wherever its pitch is one of the
  key's seven.
- **The chord's own tones, wherever the plan prints a symbol.** A note whose pitch is a tone of the
  chord symbol over it is that tone's spelling from the printed root (music21's reading of the
  symbol), unless that spelling is a double accidental: F-flat in G-flat 7, C-flat in D-flat 7.
- **The controls.** A borrowed chord whose root falls on one of the four is respelled whole: the
  tritone substitute in B-flat is still B7 (B, D-sharp and A over B), in E-flat E7, and the minor
  blues' flat VI7 in E-flat minor is B7 (the one shipped six-flat item with a respelled root, so
  the key check leaves it to this and to the chord tones). No double accidental outside the
  scales (whose one, G-sharp minor's F double sharp, is the key's own).
- **The mutation.** The committed `_readable` put back: the F-sharp check fails, and its message
  names the item, the bar and the pitch.

The seventh arpeggios and broken sevenths print no symbol; `test_generator_fingering.spelling_faults`
holds them to their stacked thirds.
"""
from __future__ import annotations

import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import dataclass
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import harmony, key, pitch  # noqa: E402

import generate_exercises as G  # noqa: E402
from tests import planned  # noqa: E402


@dataclass(frozen=True)
class Written:
    """One note as the file carries it."""

    bar: str
    staff: str
    pitch: pitch.Pitch


@dataclass(frozen=True)
class WrittenScore:
    fifths: int
    mode: str
    notes: tuple[Written, ...]
    #: `(bar, root name, kind)` for every `<harmony>`, in order.
    symbols: tuple[tuple[str, str, str], ...]


def _step_name(step: str, alter: float) -> str:
    shift = int(round(alter))
    return step + ("#" * shift if shift > 0 else "-" * -shift)


def read_back(path: Path) -> WrittenScore:
    """The key in force, every written note and every chord symbol, from the .mxl itself."""
    with zipfile.ZipFile(path) as archive:
        name = next(n for n in archive.namelist() if not n.startswith("META-INF"))
        root = ET.fromstring(archive.read(name))
    fifths, mode = None, None
    notes: list[Written] = []
    symbols: list[tuple[str, str, str]] = []
    for measure in root.iter("measure"):
        bar = measure.get("number", "?")
        for element in measure:
            if element.tag == "attributes" and fifths is None:
                signature = element.find("key")
                if signature is not None:
                    fifths = int(signature.findtext("fifths"))
                    mode = signature.findtext("mode") or "major"
            elif element.tag == "harmony":
                symbols.append((bar, _step_name(element.findtext("root/root-step"),
                                                float(element.findtext("root/root-alter") or 0)),
                                element.findtext("kind")))
            elif element.tag == "note":
                spelled = element.find("pitch")
                if spelled is None:
                    continue
                name = _step_name(spelled.findtext("step"), float(spelled.findtext("alter") or 0))
                notes.append(Written(bar, element.findtext("staff") or "1",
                                     pitch.Pitch(name + spelled.findtext("octave"))))
    return WrittenScore(fifths if fifths is not None else 0, mode or "major", tuple(notes), tuple(symbols))


def written(items: list) -> dict[str, WrittenScore]:
    """Each `(score, entry)` through the generator's own writer, then read back from the file."""
    with tempfile.TemporaryDirectory() as scratch:
        return {entry["id"]: read_back(Path(G.write(sc, scratch, entry["id"]))) for sc, entry in items}


def engraved(sc) -> key.Key | None:
    """The key signature an item engraves, or None where the empty signature is not a key."""
    if sc.editorial.get("noKeySignature"):
        return None
    return next(iter(sc.recurse().getElementsByClass(key.Key)), None)


def the_key_s_own(k: key.Key) -> dict[int, str]:
    """`{pitch class: the key's spelling}` over its seven degrees (the natural minor for a minor key)."""
    return {p.pitchClass: p.name for p in k.pitches[:7]}


def key_faults(item_id: str, score: WrittenScore, k: key.Key, strict: bool) -> list[str]:
    """
    Every written note whose pitch is one of the key's seven and whose spelling is not the key's.

    `strict`: every note must be one of the seven as well, for the items whose chords are all the
    key's own (the ii-V-I, the loop and the voicings in F-sharp and G-flat major).
    """
    own = the_key_s_own(k)
    faults = []
    for n in score.notes:
        wanted = own.get(n.pitch.pitchClass)
        if wanted is None:
            if strict:
                faults.append(f"{item_id}: bar {n.bar}, staff {n.staff}: {n.pitch.nameWithOctave} "
                              f"is not a degree of {k.tonic.name} {k.mode}")
            continue
        if n.pitch.name != wanted:
            faults.append(f"{item_id}: bar {n.bar}, staff {n.staff}: {n.pitch.nameWithOctave} is written "
                          f"where {k.tonic.name} {k.mode}'s own note is {wanted}")
    return faults


def _printed(p: pitch.Pitch) -> str:
    """A spelling as `_readable` would print it, for a pitch spelled by interval."""
    return p.simplifyEnharmonic(inPlace=False).name if abs(p.alter) > 1 else p.name


def chord_tone_faults(sc, item_id: str) -> list[str]:
    """
    Every note whose pitch is a tone of the chord symbol over it and whose spelling is not that tone's.

    The tone's spelling is music21's reading of the printed symbol: by interval from the printed
    root. A double accidental there may be written as its enharmonic (`_readable`'s first rule).
    Notes whose pitch is not in the chord (a sixth, a ninth) are not this check's, and nor is an
    approach: a single note that runs up to the next chord symbol, a semitone under its root and
    spelled toward it, is that root's and not the chord it sounds under (the walking bass's last
    beat: the F minor blues walks D-flat, F, A-flat, B into C7 under a D-flat 7 whose seventh, in
    the right hand, is C-flat). A chord tone is never excused this way: the tritone substitute's
    C-flat, a semitone under the C it resolves to, was written B in a chord, and that is a fault.
    """
    symbols = sorted(((float(cs.getOffsetInHierarchy(sc)), i, cs)
                      for i, cs in enumerate(sc.recurse().getElementsByClass(harmony.ChordSymbol))),
                     key=lambda t: (t[0], t[1]))
    if not symbols:
        return []
    faults = []
    for part in sc.parts:
        for n in part.recurse().notes:
            if isinstance(n, harmony.Harmony):
                continue
            at = float(n.getOffsetInHierarchy(sc))
            over = [(offset, cs) for offset, _i, cs in symbols if offset <= at + 1e-9]
            if not over:
                continue
            chord = over[-1][1]
            after = [(offset, cs) for offset, _i, cs in symbols if offset > over[-1][0] + 1e-9]
            approach = None
            if after and len(n.pitches) == 1 and at + float(n.quarterLength) >= after[0][0] - 1e-9:
                approach = _printed(after[0][1].root().transpose("-m2"))
            tones = {t.pitchClass: t for t in chord.pitches}
            for p in n.pitches:
                tone = tones.get(p.pitchClass)
                if tone is None or p.name == tone.name or p.name == approach:
                    continue
                if abs(tone.alter) > 1 and abs(p.alter) <= 1:
                    continue
                faults.append(f"{item_id}: bar {n.measureNumber}, {part.id} {p.nameWithOctave} under "
                              f"{chord.figure}, whose {tone.name} it is")
    return faults


def respelled_borrowed_roots(sc, k: key.Key) -> list[str]:
    """
    The chord symbols whose root is one of the key's seven pitches spelled otherwise.

    `_readable`'s third rule: a borrowed chord whose root falls on one of the four is respelled
    whole, so under that symbol the key's own spellings are not the page's, by design.
    """
    own = the_key_s_own(k)
    return [cs.figure for cs in sc.recurse().getElementsByClass(harmony.ChordSymbol)
            if own.get(cs.root().pitchClass, cs.root().name) != cs.root().name]


def f_sharp_harmony() -> list:
    """The plan's F-sharp major harmony items: the families the reviewer named, in that key."""
    families = {"seventh_voicing", "ii_v_i", "four_chord_loop"}
    return [(sc, entry) for sc, entry in planned.plan()
            if entry["drill"]["generator"]["family"] in families and entry["drill"]["params"].get("key") == "F#"]


def six_accidentals() -> list:
    """Every shipped item engraved under six sharps or six flats, with its key."""
    out = []
    for sc, entry in planned.plan():
        k = engraved(sc)
        if k is not None and abs(k.sharps) == 6:
            out.append((sc, entry, k))
    return out


def built_in_g_flat() -> list:
    """The three makers of F-sharp's check, in G-flat: not shipped, and the same mechanism."""
    items = [G.make_seventh_voicing("G-", voicing) for voicing in G.SEVENTH_VOICINGS]
    items += [G.make_ii_v_i("G-", shape) for shape, *_ in G.II_V_I_SHAPES]
    items += [G.make_four_chord_loop("G-", inversions) for inversions in (False, True)]
    return items


class TestFSharpMajorWritesItsOwnSeventh(unittest.TestCase):
    """The reviewer's case: E-sharp as E-sharp, never F, under six sharps."""

    def test_every_f_sharp_harmony_item_writes_the_key_s_own_notes(self) -> None:
        items = f_sharp_harmony()
        self.assertEqual(len(items), len(G.SEVENTH_VOICINGS) + len(G.II_V_I_SHAPES) + 2,
                         "the plan's F-sharp items: four voicings, three ii-V-I shapes, two loops")
        faults = []
        for item_id, score in written(items).items():
            self.assertEqual((score.fifths, score.mode), (6, "major"), item_id)
            faults += key_faults(item_id, score, key.Key("F#"), strict=True)
            with self.subTest(item=item_id):
                self.assertIn("E#", {n.pitch.name for n in score.notes},
                              f"{item_id}: the key's seventh is in its chords and is not written")
                self.assertNotIn("F", {n.pitch.name for n in score.notes}, item_id)
        self.assertEqual(faults, [], "\n".join(faults[:20]) + f"\n{len(faults)} in all")


class TestTheSixFlatsWriteCFlat(unittest.TestCase):
    """C-flat as C-flat where the key has it: G-flat major and E-flat minor."""

    def test_the_harmony_makers_in_g_flat_write_the_key_s_own_notes(self) -> None:
        faults = []
        for item_id, score in written(built_in_g_flat()).items():
            self.assertEqual((score.fifths, score.mode), (-6, "major"), item_id)
            faults += key_faults(item_id, score, key.Key("G-"), strict=True)
            with self.subTest(item=item_id):
                self.assertIn("C-", {n.pitch.name for n in score.notes}, item_id)
                self.assertNotIn("B", {n.pitch.name for n in score.notes}, item_id)
        self.assertEqual(faults, [], "\n".join(faults[:20]) + f"\n{len(faults)} in all")

    def test_every_shipped_item_under_six_accidentals_writes_the_key_s_own_notes(self) -> None:
        items = six_accidentals()
        keys = {entry["id"]: k for _sc, entry, k in items}
        tonics = {(k.tonic.name, k.mode) for k in keys.values()}
        self.assertEqual(tonics, {("F#", "major"), ("G-", "major"), ("E-", "minor")},
                         "the plan's six-accidental keys")
        # An item with a borrowed chord respelled whole is held by the chord-tone check and its
        # control instead: under that symbol the key's spellings are not the page's, by the rule.
        # There is one, the E-flat minor blues (its flat VI7 is B7, `TestTheControls`).
        borrowed = {entry["id"]: respelled_borrowed_roots(sc, k) for sc, entry, k in items}
        borrowed = {item_id: figures for item_id, figures in borrowed.items() if figures}
        self.assertEqual(borrowed, {"exercise.walking-bass.e-flat.minor-blues": ["B7"]})
        faults = []
        kept = [(sc, entry) for sc, entry, _k in items if entry["id"] not in borrowed]
        for item_id, score in written(kept).items():
            k = keys[item_id]
            self.assertEqual((abs(score.fifths), score.mode), (6, k.mode), item_id)
            faults += key_faults(item_id, score, k, strict=False)
        self.assertEqual(faults, [], "\n".join(faults[:20]) + f"\n{len(faults)} in all")

    def test_the_six_flat_items_that_carry_c_flat_carry_it(self) -> None:
        # The quartal voicing's iv is A-flat minor 11 (A-flat, D-flat, G-flat, C-flat over the bass)
        # and the minor blues' iv is A-flat minor 7: both hold the key's own sixth.
        wanted = {"exercise.open-voicing.e-flat.quartal", "exercise.walking-bass.e-flat.minor-blues"}
        items = [(sc, entry) for sc, entry, _k in six_accidentals() if entry["id"] in wanted]
        self.assertEqual({entry["id"] for _sc, entry in items}, wanted)
        for item_id, score in written(items).items():
            with self.subTest(item=item_id):
                self.assertIn("C-", {n.pitch.name for n in score.notes}, item_id)


class TestEveryChordToneIsItsChordsOwn(unittest.TestCase):
    """Wherever the plan prints a chord symbol, the notes under it spell its tones."""

    def test_every_item_with_symbols(self) -> None:
        faults, checked = [], 0
        for sc, entry in planned.plan():
            found = chord_tone_faults(sc, entry["id"])
            if next(iter(sc.recurse().getElementsByClass(harmony.ChordSymbol)), None) is not None:
                checked += 1
            faults += found
        self.assertGreater(checked, 0)
        self.assertEqual(faults, [], "\n".join(faults[:20]) + f"\n{len(faults)} in all")


class TestTheControls(unittest.TestCase):
    """What the policy still respells, and what must not come back."""

    def test_the_tritone_substitute_in_b_flat_is_b7_and_in_e_flat_e7(self) -> None:
        items = [(sc, entry) for sc, entry in planned.plan()
                 if entry["id"] in ("exercise.tritone-sub.b-flat", "exercise.tritone-sub.e-flat")]
        self.assertEqual(len(items), 2)
        wanted = {
            "exercise.tritone-sub.b-flat": ("B", {"1": {"B", "D#", "A"}, "2": {"B"}}),
            "exercise.tritone-sub.e-flat": ("E", {"1": {"E", "G#", "D"}, "2": {"E"}}),
        }
        for item_id, score in written(items).items():
            root, staves = wanted[item_id]
            with self.subTest(item=item_id):
                self.assertEqual([(s[1], s[2]) for s in score.symbols if s[0] == "2"], [(root, "dominant")])
                for staff, names in staves.items():
                    self.assertEqual({n.pitch.name for n in score.notes if n.bar == "2" and n.staff == staff},
                                     names, f"{item_id}: bar 2, staff {staff}")

    def test_the_minor_blues_flat_six_seven_in_e_flat_minor_stays_b7(self) -> None:
        # `_transpose_name` spells against the major on the tonic, so the flat VI7 is chromatic and
        # borrowed (its table: "the only place a minor blues leaves the key"), and its C-flat root
        # is respelled whole: B7, B D-sharp A in the right hand, each voice a semitone above the
        # B-flat 7 it slides into. Spelled C-flat 7 it would drop an octave, because the maker
        # places a root by its written octave and C-flat 4 sounds B3 (recorded, not changed). The
        # iv's third is the key's C-flat (bars 5 and 6), which the committed policy wrote B.
        items = [(sc, entry) for sc, entry in planned.plan()
                 if entry["id"] == "exercise.walking-bass.e-flat.minor-blues"]
        score = written(items)["exercise.walking-bass.e-flat.minor-blues"]
        self.assertEqual([(s[1], s[2]) for s in score.symbols if s[0] == "9"], [("B", "dominant")])
        right = {bar: sorted((n.pitch for n in score.notes if n.bar == bar and n.staff == "1"),
                             key=lambda p: p.ps) for bar in ("9", "10")}
        self.assertEqual([p.name for p in right["9"]], ["B", "D#", "A"])
        self.assertEqual([b.ps - a.ps for a, b in zip(right["10"], right["9"])], [1.0, 1.0, 1.0])
        for bar in ("5", "6"):
            self.assertIn("C-", {n.pitch.name for n in score.notes if n.bar == bar}, f"bar {bar}")
            self.assertNotIn("B", {n.pitch.name for n in score.notes if n.bar == bar}, f"bar {bar}")

    def test_no_double_accidental_outside_the_scales(self) -> None:
        # The scales are music21's, spelled from the key and not by the policy: G-sharp minor's
        # raised seventh is F double sharp, the one double accidental the plan writes, and it is
        # right. Everything else is spelled by interval or by `_transpose_name`.
        doubles = sorted({f"{entry['id']}: {p.nameWithOctave}"
                          for sc, entry in planned.plan() if entry["drill"]["generator"]["family"] != "scale"
                          for n in sc.recurse().notes if not isinstance(n, harmony.Harmony)
                          for p in n.pitches if abs(p.alter) > 1})
        self.assertEqual(doubles, [], "\n".join(doubles[:20]))


def committed_readable(p: pitch.Pitch, borrowed_root: bool = False) -> pitch.Pitch:
    """`_readable` as it stood before D0a: every one of the four respelled, in every key."""
    if abs(p.alter) > 1 or p.name in G.UNWRITTEN:
        return p.simplifyEnharmonic(inPlace=False)
    return p


class TestTheMutation(unittest.TestCase):
    """The committed policy put back turns the F-sharp case red, naming item, bar and pitch."""

    def test_the_committed_policy_fails_the_f_sharp_check(self) -> None:
        with mock.patch.object(G, "_readable", committed_readable):
            item = G.make_ii_v_i("F#")
        score = written([item])["exercise.ii-v-i.f-sharp"]
        faults = key_faults("exercise.ii-v-i.f-sharp", score, key.Key("F#"), strict=True)
        self.assertTrue(faults, "the committed policy passed the F-sharp check")
        self.assertEqual(
            faults[0],
            "exercise.ii-v-i.f-sharp: bar 2, staff 1: F4 is written where F# major's own note is E#")
        self.assertNotIn("E#", {n.pitch.name for n in score.notes})


if __name__ == "__main__":
    unittest.main()
