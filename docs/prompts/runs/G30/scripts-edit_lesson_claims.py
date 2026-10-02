"""G30's replacement of three lesson-claim tests that held a lesson to a G30 family's printed fingering.

usage: python docs/prompts/runs/G30/scripts-edit_lesson_claims.py
app/tests/unit/lessonClaimsAboutMusic.test.ts. Class: replace. The old assumption: the inversions, the double
thirds and sixths, and the octave scale print their fingering, and technique.7 says so. Since G30 their rows
print none; each case now holds the built file to no printed finger and the lesson to what it says now. The
technique.4 case keeps the sourced families (scale, arpeggio, chromatic) fingered on every note. Idempotent.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
PATH = ROOT / "app" / "tests" / "unit" / "lessonClaimsAboutMusic.test.ts"

EDITS = [
    ("""    'technique.4',
    'the scale, arpeggio, chromatic and inversion exercises finger every note, and the articulation ones finger none',
    () => {
      const options = t12Exercises('technique.4');
      const named = options.filter((id) => /\\.(scale|arpeggio|chromatic|inversions)\\./.test(id));
      const articulation = options.filter((id) => id.includes('articulation'));
      return (
        named.length === 6 &&
        named.every((id) => t12Sounded(id).every((note) => note.finger !== null)) &&
        articulation.length === 4 &&
""", """    'technique.4',
    // Revised by G30 (the old assumption: the inversions print their fingering). Their row's convention is the
    // generator's own, with no source, so since G30 none is printed; the sourced shapes still print every finger.
    'the scale, arpeggio and chromatic exercises finger every note, the inversions and the articulation ones finger none',
    () => {
      const options = t12Exercises('technique.4');
      const sourced = options.filter((id) => /\\.(scale|arpeggio|chromatic)\\./.test(id));
      const inversions = options.filter((id) => id.includes('.inversions.'));
      const articulation = options.filter((id) => id.includes('articulation'));
      return (
        sourced.length === 4 &&
        sourced.every((id) => t12Sounded(id).every((note) => note.finger !== null)) &&
        inversions.length === 2 &&
        inversions.every((id) => t12Sounded(id).length > 0 && t12Sounded(id).every((note) => note.finger === null)) &&
        articulation.length === 4 &&
"""),
    ("""    'technique.7',
    'the thirds are fingered in the three-group cycle and the sixths are not',
    () => {
      const pairs = (id: string): string[] =>
        t12bGroups(id, id.endsWith('.left') ? 2 : 1)
          .filter((group) => group.fingers.length === 2)
          .map((group) => group.fingers.join('-'));
      const thirds = pairs('exercise.double-third.c.1oct.right').slice(0, 6);
      const sixths = pairs('exercise.double-sixth.c.1oct.right').slice(0, 4);
      return (
        thirds.join(' ') === '1-3 2-4 3-5 1-3 2-4 3-5' && sixths.join(' ') === '1-5 1-5 2-5 1-4'
      );
    },
""", """    'technique.7',
    // Revised by G30 (the old assumption: the thirds and sixths print the three-group cycle and 1-5/2-5/1-4).
    // Their row's convention is the generator's own, so none is printed; the lesson gives it in words.
    'the thirds and sixths print no finger, and the lesson gives their fingering as a common one, a starting point, not a rule',
    () => {
      const ids = ['third', 'sixth'].flatMap((shape) =>
        ['right', 'left'].map((hand) => `exercise.double-${shape}.c.1oct.${hand}`),
      );
      const groups = (id: string): T12bGroup[] => t12bGroups(id, id.endsWith('.left') ? 2 : 1);
      const text = f0mText('technique.7');
      return (
        ids.every((id) => t12Exercises('technique.7').includes(id)) &&
        ids.every((id) => groups(id).some((group) => group.midis.length === 2)) &&
        ids.every((id) => groups(id).every((group) => group.fingers.every((finger) => finger === null))) &&
        text.includes('A common fingering: in thirds the three-group cycle, 1-3, 2-4, 3-5') &&
        text.includes('None is printed: a starting point, not a rule.') &&
        !text.includes('Both fingers are printed')
      );
    },
"""),
    ("""    'technique.7',
    'the octave scale prints thumb and fifth on white keys and thumb and fourth on black keys in both hands, and the lesson calls it a common fingering, not a rule',
    () => {
      const notes = t12Sounded('exercise.octave-scale.a.1oct.both');
      const black = (midi: number | null): boolean => [1, 3, 6, 8, 10].includes((midi ?? 0) % 12);
      const outer = notes.filter((note) => (note.staff === 1 ? note.chord : !note.chord));
      const thumbs = notes.filter((note) => (note.staff === 1 ? !note.chord : note.chord));
      const text = f0mText('technique.7');
      return (
        t12Exercises('technique.7').includes('exercise.octave-scale.a.1oct.both') &&
        outer.length > 0 &&
        outer.some((note) => black(note.midi)) &&
        outer.every((note) => note.finger === (black(note.midi) ? '4' : '5')) &&
        thumbs.every((note) => note.finger === '1') &&
        text.includes('is common, not a rule') &&
""", """    'technique.7',
    // Revised by G30 (the old assumption: the octave scale prints thumb and fifth, thumb and fourth). Its row's
    // convention is the generator's own, so none is printed; the lesson names the fingering without "printed".
    'the octave scale prints no finger, and the lesson gives thumb and fifth on white keys and thumb and fourth on black as a common fingering, not a rule',
    () => {
      const notes = t12Sounded('exercise.octave-scale.a.1oct.both');
      const text = f0mText('technique.7');
      return (
        t12Exercises('technique.7').includes('exercise.octave-scale.a.1oct.both') &&
        notes.some((note) => note.chord) &&
        notes.every((note) => note.finger === null) &&
        text.includes('The fingering, thumb and fifth on white keys and thumb and fourth on black ones in both hands, is common, not a rule') &&
        !text.includes('The printed fingering') &&
"""),
]


def main() -> None:
    raw = PATH.read_bytes()
    crlf = b"\r\n" in raw
    text = raw.decode("utf-8").replace("\r\n", "\n")
    done = 0
    for old, new in EDITS:
        if new in text:
            continue
        assert text.count(old) == 1, old[:80]
        text = text.replace(old, new)
        done += 1
    out = (text.replace("\n", "\r\n") if crlf else text).encode("utf-8")
    if out != raw:
        PATH.write_bytes(out)
    print(f"{done} of {len(EDITS)} cases replaced")


if __name__ == "__main__":
    main()
