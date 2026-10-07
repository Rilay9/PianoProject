# Review response — PH1, G6a, MT1 and the owner-work enforcement checks

**Verdict: APPROVE WITH REQUESTED CHANGES**

**Current scoreboard: 1 / 28 MUST abilities shipped. PACKET-TRACE remains PARTIAL 96 / MISSING 5.** The handoff's 0/28 opening is historical now: A7c.1 shipped after this handoff was written. A7b.1 remains `draft`.

I read the immutable handoff first, then PH1's census, music21 comparison, differential and mutants; `measureWalk.ts`, `harmony.ts` and `positionedHarmony.test.ts`; G6a's drill code, catalogue row, CK-6 Python oracle/fixture and app test; the current answer-staff path; the MT1 brief and the chart timing premises it cites; and the current owner-work / shipped-journey enforcement. I reviewed the landed implementation at `c8b86b13` and checked the current tree through `a32d2739`: no PH1 or G6a implementation file changed after the landing. Nothing heard.

## 1. Enforcement checks — APPROVE, in their current strengthened form

The intent is right and the current implementation is stronger than the handoff's description of `fb89c810`.

Accepted current shape:

- `status: shipped` needs an `acceptance_journey` under `app/tests/e2e/`, and that spec must declare the exact ability with `// acceptance-ability: <id>`; an unrelated browser spec cannot satisfy another chain.
- The owner-work guard is on the docs-integrity path that actually sees `docs/review/**`; it is not dependent on the full CI path that ignores review-only pushes.
- The historical baseline is frozen at 222 files.
- `Non-automatable:` is scoped to exactly the immediately following owner-check line; it is not a whole-handoff escape hatch.
- The matcher adversaries live in the docs-integrity checker suite, so the production scan and the rule that protects it travel together.

Do not regress to the earlier whole-handoff exemption or to a guard that only full CI runs. This is enforcement of the existing owner/addressee rule, not a new policy layer.

## 2. PH1 — APPROVE WITH ONE REQUIRED CHANGE before PH2 consumes it

The central implementation is good. The shared walk is the right architecture; the position tests cover the six required cases; the tempo and legacy-chart differentials are null across the 2,090 common files; the independent music21 comparison found **zero offset disagreements**; and the mutants show the important cursor, offset, duplicate and carry mistakes actually go red.

### Required change: preserve source-measure identity, not only the written number

The census reports 43 same-offset conflicts, but **12 are from distinct source measures that happen to share a written measure number**. Those are not harmony conflicts. PH1 currently drops the walk's source-measure ordinal when it creates `ChordSymbol`, then `chartSegments` groups symbols by the parsed written number. A repeated number therefore collapses two real measures into one logical chart bar. Suffixed/non-numeric measure labels are the same class of identity problem.

Fix PH1 before PH2:

- carry the walk's source-measure ordinal / stable source identity into `ChordSymbol` and `ChartMeasure`;
- use that source identity and source order for segmentation and consumption;
- keep the written measure number/label only as display metadata, not as the unique key;
- add an adversary where two successive source measures share the same printed number and remain two chart bars with no false conflict;
- add/pin a suffixed or otherwise non-simple written number so parsing it cannot fold it onto another measure.

This is a model correction, not a PH2 presentation choice. PH2 must not "resolve by order" after the model has already merged two measures.

Once that fix lands and its targeted tests are green, PH2 may dispatch under the rulings below; no new pre-dispatch design round is needed unless the fix changes more than source identity.

### PH1's four decisions

**1. Short first bar without `implicit`: confirm the current reading.** A first source measure shorter than the time signature may be treated as an **inferred pickup** and keep its notated length. The corpus has real instances, and the music21 comparison supports the class. Keep the distinction in the model: `implicit="yes"` is explicit incomplete/pickup notation; a short first unflagged bar is an inference, not evidence that the XML explicitly said pickup.

**2. Carry after a split bar: confirm.** A bar with no new symbol carries the **last harmony sounding at the end of the previous bar**, not that previous bar's first symbol. The 543 source-corpus changes are therefore intended semantic corrections when PH2 starts consuming the positioned model.

**3. Bars past the end: draw the model's real source measures only.** Do not continue today's `max(measure-count, symbol-count)` behavior that fabricates trailing bars. After the identity fix above, PH2 should iterate the model's source measures in source order. Do not reconstruct the sequence from a set of numeric written measure numbers: pickups numbered 0, repeated numbers and suffixed labels make that non-equivalent.

**4. Same-offset conflicts: distinguish false identity collisions from true conflicts.**
- The 12 repeated-number cases disappear as conflicts once source-measure identity is preserved.
- For the remaining true same-source-measure, same-offset conflicts: keep every distinct symbol and **show the ambiguity rather than choosing one**. Stacking the symbols is acceptable.
- During the conflicted interval, suspend harmony-dependent consumers: no chosen Comp chord, no bass root derived from a guessed chord, and no live yes/no chord verdict. The click, and percussion that does not depend on a chord root, may continue if its own metre/groove contract permits it.
- Exact duplicates at the same place still merge.
- If a learner-critical piece later requires one of these bars to mean one harmony, establish that item-specific truth explicitly rather than adding a corpus-wide arbitrary winner.

That preserves PH1's governing rule: report ambiguity; never manufacture certainty from part order.

## 3. G6a — APPROVE WITH ONE REQUIRED CHANGE before G6b places the item

The new item has the right identity and boundary:

- `drill.jazz.minor-ii-v-i-shells` is distinct from the live major shell drill;
- all nine C/A/G-minor cases are present and asked in the fixed population;
- Cm6, Am7 and Gm7 remain data per case rather than a fabricated universal minor-tonic rule;
- CK-6 checks full symbol/numeral truth and the configured shell members against music21;
- the omitted-flat-five boundary is correctly expected green for the shell and remains a lesson truth, not a fake drill distinction;
- the item is placed nowhere yet and the existing chord rows remain unchanged.

### Required change: the answer staff should use the prompt's named key

Choose the handoff's **prompt-key-signature** option.

The card says, for example, "Cm6 — i in C minor". An answer staff carrying two flats because they happen to minimise accidentals for C-E♭-A silently shows a different tonal context from the one the prompt names. E7 "in A minor" under three sharps has the same problem.

For the new `cases` path:

- C minor answer staff: three flats;
- A minor: no sharps/flats;
- G minor: two flats;
- write chromatic chord members as accidentals against that key: e.g. G7's B natural in C minor, E7's G♯ in A minor, D7's F♯ in G minor, and Cm6's A natural against C minor's A♭.

That is pedagogically useful rather than cosmetic: it shows why the dominant and the Cm6 tonic contain notes outside the natural minor signature.

Implement it additively for case-based prompts; do not parse the visible label to recover the key. A small optional answer-spelling/key field on the case prompt is preferable. Pin the exact key-signature fifths and accidentals in CK-6's app half, and keep the differential proving every pre-existing drill prompt and answer staff unchanged.

G6b may carry this fix-forward as its first step under this ruling; it does not need a separate design handoff unless the implementation would change answer notation for non-case drills.

## 4. MT1 — APPROVE WITH REQUESTED CHANGES before dispatch

**Land MT1 before PH2.** The sequencing argument is correct: PH2's event timing depends on the metre-true clock, and building positioned comp/backing on today's four-beat assumption would create immediate rework.

### Approved MT1 rules

- The chart's click/tracker follows the written/felt beat using the already-reviewed app metre reading: 2/4 → 2 quarters; 3/4 → 3 quarters; 4/4 → 4 quarters; 5/4 → 5 quarters; 6/8 → 2 dotted quarters; 12/8 → 4 dotted quarters; 2/2 → 2 halves.
- Accent remains only on beat 1.
- The tempo control may display beats per minute in that beat's unit while preserving the same sounding quarter-note tempo. When the beat is not a quarter, the UI must make the unit visible; the number alone is not enough.
- `ChartMeasure` should gain the written signature in force. Fold this onto PH1's corrected source-measure identity; do not create another measure-key scheme.
- The 5/4 metronome does not need to invent 3+2 versus 2+3. Five equal quarter clicks with only the downbeat accented is an honest neutral count.
- Pickups may stay outside MT1's implementation, **but PH2 must consume PH1's notated pickup length when it makes the positioned timeline visible/audible**. The existing nominal-full-bar behavior is not permission to discard PH1's pickup fact indefinitely.

### Required MT1 change: do not introduce unverified non-4/4 grooves

The brief correctly refuses Bass + drums in 5/4, 6/8 and 12/8 because no established pattern fits. It should apply the same evidence rule to **2/4, 3/4 and 2/2**.

`barSchedule` happens to accept two or three beats, but on the Chord chart those would be new learner-facing accompaniment behaviors. The brief itself labels those patterns **unverified as music**. Reuse of code is not verification of the musical role.

For MT1:

- 4/4 Bass + drums stays exactly today's behavior.
- For every non-4/4 metre, disable Bass + drums with the visible reason **unless an existing, cited musical contract already establishes that exact pattern in that metre**.
- If a later lane establishes a 2/4, 3/4, 2/2, compound or odd-metre groove, it can enable that metre then; do not make MT1 guess it simply because a generic scheduler can emit notes.

The metronome, bar tracker and plain chord Comp do not need to wait for such groove work. This keeps the timing correction useful without turning a P1 correctness fix into unsourced accompaniment teaching.

### MT1 acceptance additions

Keep the brief's red-first/browser/differential plan, with these adjustments:

- the browser cases for non-4/4 Bass + drums expect a disabled chip unless that metre has an established contract;
- include a 3/4 case specifically proving that the old unsourced "jazz waltz" helper comment does not silently authorize chart backing;
- keep Blue Bossa and a 4/4 pickup in the byte/time differential;
- across a metre change, pin the first beat of the new bar as the accent and its new beat count before PH2 builds on it.

## 5. Dispatch

- **PH2:** held only for the PH1 source-measure-identity fix above; after that fix and its targeted tests, dispatch under these rulings.
- **G6b:** may dispatch with the prompt-key-signature fix as its first bounded fix-forward, then do the already-approved jazz.6 placement/lesson work.
- **MT1:** dispatch after its brief is amended so non-4/4 Bass + drums is fail-closed unless that exact metre's groove is already established.

The CB1 check-map repair and A7b.1 step-4 scaffold addition are accepted. CI and docs-integrity are green on `c8b86b13`; no stale failure is being carried forward.
