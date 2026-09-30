# Reviewer response — content-item check at `827289d0`

## Scope

This is the owner-requested §12 content check, not another implementation review. I checked the four itemisations at:

- `handoffs/e6c20b03.content.md` — L120c
- `handoffs/4e76c768.content.md` — L120d
- `handoffs/68e0479b.content.md` — E50
- `handoffs/a95ebcdd.content.md` — E50a

The question here is whether each learner-facing lesson/curriculum/vocabulary change is correct as a fact or teaching claim, and for E50 whether each repaired tempo is the correct reading of what the edition encodes. Nothing in this review is an ear/listening verdict. Where notation or text settles the claim, I say so; where a judgement would require hearing the result, it stays for the listening packet.

## Verdict

**CONTENT CHECK PASSES. No factual correction required on these four landed seams.**

I found no item in the four `.content.md` files whose stated teaching/content fact is false on the evidence below. The musical-quality/curation questions that cannot be settled from notation are explicitly named under **Not checked** rather than silently approved by ear.

## L120c — `e6c20b03.content.md`

### Checked: vocabulary and ownership

- `sixteenth-notes` is an honest concept for the material 4.4 actually teaches. Hanon 1–5 in the built app are all 2/4; every sounding note before the simultaneous final half notes is a sixteenth; primary beams group them four at a time and each group begins on a quarter-note beat. The lesson's new wording — four sixteenths to the quarter-note beat, two groups in a 2/4 bar, counted `1 e and a, 2 e and a` — matches that notation and the app's quarter-note click.
- `rhythm.sixteenths.taughtAt = ["4.4"]` is correct for the curriculum's teaching meaning. 4.4 is the first rung on the relevant core path that actually explains the notation. `ragtime.5` and `technique.6` legitimately name `sixteenth-notes` as material they practise, but both stand on 4.4 and therefore are not second first-teaching rungs.
- `ragtime.5` really does teach/practise the sixteenth-note material it now claims: the lesson names the sixteenth–eighth–sixteenth syncopation, says it is straight rather than swung, and tells the learner to count sixteenths aloud.
- `technique.6` legitimately carries the concept as practice/ownership rather than first teaching: its lesson explicitly describes a page of sixteenths and measured four-notes-to-the-beat work.
- `jazz.4` legitimately claims `syncopation`. The lesson teaches the Charleston as beat 1 plus the `and` of 2 and an off-beat pattern played only on the `ands`, over a bass/time reference. That is an actual syncopated rhythmic task, not a label added because a genre is called jazz.
- The `taughtAtNote` wording that later `latin.7` / `holiday.7` inherit sixteenths through 4.4, rather than becoming owners themselves, matches the recorded ancestry/claim rule.

### Checked: placement and lesson sentences

- **3.4 and 4.2, Für Elise beginner → easy:** correct as the intended simplification. The removed beginner setting is the sixteenth-heavy 3/8 setting; the easy setting is the A-minor simplified setting in 3/4 using eighths/quarters instead of that sixteenth texture. The 4.2 sentence still truthfully offers a minor-key Stage-4/Grade-1-range piece.
- **3.5, Canon → Schumann Chorale:** the replacement facts are correct. The removed Canon's fifth variation carries the pre-4.4 sixteenths. The Schumann Op. 68 No. 4 catalogue score is the four-voice chorale setting used here, in half-note chordal motion, and it does not import a hidden sixteenth claim. The learner-facing text correctly names the replacement as Schumann's *Chorale* from *Album for the Young*; the duet sentence names the item the curriculum now opens.
- **3.6, Canon removed:** correct as a curriculum fact. The lesson does not depend on the Canon and is song-optional; the Canon remains later where 4.4 is on the path.
- **4.3, Canon → Schumann Melody:** correct. The catalogue score is Schumann Op. 68 No. 1, C major, 20 bars. The notation-backed lesson test reads the left-hand line and verifies the lesson's substantive claim: the left hand runs in eighths under the tune in nearly every bar. This is a real broken-chord/accompanimental texture claim, not title-based inference.
- The `concepts.json` comment changes are bookkeeping restatements of the same mapping and are correct.

## L120d — `4e76c768.content.md`

### Checked

- Right-hand C position is taught at 1.1 as middle C through G with one finger per white key, thumb on C; the stored span bounds C4–G4 are MIDI 60–67.
- Left-hand C position is taught at 1.3 as C3 D3 E3 F3 G3, finger 5 on C3 through thumb on G3; the stored span bounds C3–G3 are MIDI 48–55.
- 1.5 explicitly says that up to that point the learner has been reading by note name, then introduces interval reading; it defines a leap as a fourth or wider and says the next rung practises it.
- 2.1 actually practises the left-hand C→F and C→G moves and explicitly calls them a fourth and a fifth, wider than a skip. So keeping `interval.leap.taughtAt` at 2.1 while allowing an earlier **coping** route inside an already-taught fixed position is faithful to what the lessons say: it does not claim that interval-leap reading was already taught.
- Copying the same fixed-position declarations from `interval.skip` to `interval.leap` therefore describes the intended alternate note-name route correctly. It remains a coping fact only; it is not evidence and does not alter the leap detector.
- I checked the actual rows this change releases from the untaught table: the Jingle Bells right-hand chorus at 1.2 and holiday, plus the hands-together holiday chorus. Their measured sounding spans sit inside the appropriate taught C-position spans. `When the Saints` is also inside the spans but remains refused on its separate syncopation demand, so L120d does not falsely make it generally eligible.

One representation note, **not a defect in the current affected items**: `fixedPositions` stores the outer MIDI bounds, not a pitch-class whitelist. That is sufficient for the current C-major affected rows and the current teaching order; I am not reading `60–67` as a universal assertion that every chromatic pitch between C and G is itself a C-position key.

## E50 — `68e0479b.content.md`

### The seven printed-tempo readings: all checked

The raw/source evidence for all seven is the same shape: the opening direction contains words `= N`, with no usable note glyph, no `<metronome>` and no `<sound tempo>` of its own. All seven marks occur in 4/4. Under the already-reviewed missing-glyph rule, the metre supplies the beat unit, so the correct reading is **quarter = N**.

| score | encoded edition words | checked reading |
| --- | ---: | ---: |
| Margie | `= 160` | quarter = **160** |
| Limehouse Blues | `= 184` | quarter = **184** |
| Singin' the Blues | `= 120` | quarter = **120** |
| Weary Blues | `= 200` | quarter = **200** |
| Storyville Blues | `= 132` | quarter = **132** |
| Wabash Blues | `= 120` | quarter = **120** |
| Tishomingo Blues | `= 132` | quarter = **132** |

Those are therefore the correct factual replacements for the invented/defaulted 96 values in the seven `pdmx.json` rows. The Wabash b1–4 cut inherits the same opening printed mark, quarter = 120.

I also checked the content-contract wording added to `catalog.schema.json`: E50's reviewed repair identities are correctly described as learner-continuity aliases beside E50a's historical dated identities, not as current exact-byte identity, renewed approval, or a rewrite of stored runs.

## E50a — `a95ebcdd.content.md`

### Checked

The content-side item is the `formerIdentities` schema contract, not a lesson/music change. Its claim is correct:

- the historical aliases are concrete old file identities from catalogues capable of storing learner material;
- each is re-proved against the current undated musical file rather than generated as a rolling date window;
- learner continuity resolves stored run/encounter/project material through those aliases;
- exact-byte identity remains the current `identity`, so review/checksum/excerpt-parent meanings are not collapsed into learner-material equality.

The later E50 sentence appended to that schema is also consistent with the separate `repaired_identities.json` relation: a reviewed musical repair can contribute an old identity for learner continuity without redefining the historical-date table.

## Not checked

**No factual item listed in the four `.content.md` files was left unchecked at the level requested here.**

What I deliberately did **not** claim to check, because this pass has no listening component:

- whether Schumann's *Chorale* is, by ear and in practice, the best pedagogical/curation choice for 3.5 rather than merely a factually compatible one;
- whether Schumann's *Melody* is the best musical choice for 4.3 rather than a notation-correct one;
- whether the seven E50 printed tempos are musically convincing performances for these particular editions/pieces. I checked only that the numbers are the correct readings of what the encoded editions print under the established missing-glyph rule.

Those are listening/curation questions and belong in the owner's listening packet if they matter there; they are not grounds to falsify the factual content above.

## Disposition

No content correction is required from this check. L120c, L120d's landed content, E50 and E50a remain factually sound on the content items reviewed here. This does not change the already-dispatched implementation fix-forwards (L120e and E50b), whose reasons are separate from these content facts.
