"""Station 3 and the Lab half of Station 4: the app's outputs (app-facts.json, written by
app/build/A7b1-probe/facts.probe.ts) against music21's RomanNumeral(fig, Key(minor tonic)).

For the shell drill the oracle is the root-3-7 subset of music21's chord (root, third, seventh by
chord member, music21's own getChordStep), so a shell is compared with a shell; the full chord is
compared too. For i, music21's RomanNumeral('i') is a triad; the table also prints the music21 sets
for the two tonic seventh/sixth chords the ruling names (Cm6, Am7: 'i6' would be an inversion in
music21's figured-bass notation, so the minor-sixth tonic is built with harmony.ChordSymbol).
"""
import json
from pathlib import Path

from music21 import harmony, key, roman

HERE = Path(__file__).resolve().parent
NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]
facts = json.loads((HERE / "app-facts.json").read_text(encoding="utf-8"))


def n(pcs):
    return "-".join(NAMES[p] for p in sorted(pcs))


def m21(fig, tonic):
    rn = roman.RomanNumeral(fig, key.Key(tonic))
    full = {p.pitchClass for p in rn.pitches}
    shell = set()
    for step in (1, 3, 7):
        p = rn.getChordStep(step)
        if p is not None:
            shell.add(p.pitchClass)
    return full, shell


print("STATION 3: shellChord (the drill) against music21, figure x key")
print(f"{'key':<5}{'figure':<7}{'drill shell':<14}{'m21 shell (1,3,7)':<20}{'agree':<7}{'romanToChord':<16}{'m21 full':<14}agree")
disagree = []
for r in facts["station3"]:
    full, shell = m21(r["figure"], r["key"])
    a1 = set(r["shell"]) == shell
    a2 = set(r["full"]) == full
    if not a1 or not a2:
        disagree.append((r["key"], r["figure"], a1, a2))
    print(f"{r['key']:<5}{r['figure']:<7}{n(r['shell']):<14}{n(shell):<20}{'yes' if a1 else 'NO':<7}"
          f"{n(r['full']):<16}{n(full):<14}{'yes' if a2 else 'NO'}")
print("disagreements:", disagree)

print("\nThe tonic chords the ruling names, music21 ChordSymbol, and their root-3-6 / root-3-7 shells:")
for sym in ("Cm6", "Cm7", "Gm7", "Dm7", "Am7", "Fm7", "Gm6", "Dm6"):
    cs = harmony.ChordSymbol(sym)
    print(f"  {sym:<5} {n({p.pitchClass for p in cs.pitches})}")

print("\nSTATION 4: the Lab's minor ii-V-I (romanToLabChord) against music21, nine minor keys")
lab_dis = []
for k in facts["labKeys"]:
    tonic = NAMES[k["tonic"]].replace("b", "-").lower() if "b" in NAMES[k["tonic"]] else NAMES[k["tonic"]].lower()
    if k["id"] == "fs-minor":
        tonic = "f#"
    if k["id"] == "cs-minor":
        tonic = "c#"
    cells = []
    for c in k["chords"]:
        full, _ = m21(c["roman"], tonic)
        ok = set(c["pcs"]) == full
        if not ok:
            lab_dis.append((k["id"], c["roman"]))
        cells.append(f"{c['roman']}={c['label']}({n(c['pcs'])}){'' if ok else ' != m21 ' + n(full)}")
    print(f"  {k['id']:<10} m21 key {tonic:<3} " + "  ".join(cells[:3]))
print("lab disagreements:", lab_dis)
