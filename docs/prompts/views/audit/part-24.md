===== PART 24: EXCERPTS ARE FIRST-CLASS CONTENT OBJECTS, NOT ALIASES FOR `teaching.sections` (2026-09-26; E with R7, R15, R35, R38–R40, R42, R44) =====

Verified: `content/sources/sections.json` ("Named practice sections for the loop"),
`attach_sections()` in `tools/content/build.py:499`, and `sections?: { label, fromMeasure,
toMeasure }[]` on the item type (`types.ts:108`) — whole catalogue item → named printed-bar
range → a Score loop ("First phrase", "Main theme"). That mechanism stays as it is.

**E's excerpt is a different concept**: source score → candidate passage → measured passage
demands → pedagogical opportunity → musical-boundary judgement → human review → approved
excerpt → an independent identity for teaching, recommendation and evidence. A section and an
excerpt may reference the same bars and remain different objects; neither masquerades as the
other; they are not merged because both hold bar ranges — that is the correct complexity. If an
excerpt stayed `{fromMeasure, toMeasure}` on the parent, every important property (level,
measured demands, target opportunity, role, eligibility, evidence history, review, provenance)
would remain whole-score metadata and a four-bar right-hand passage would inherit a forty-bar
two-hand arrangement's demands; the teacher would reason about the wrong object and mining would
be cosmetic.

**Identity** (R15, R35): composition → arrangement → edition or source score → excerpt; an
excerpt's identity derives from the source score or edition, the printed measure range, the
part, hand or staff selection where applicable, and a transformation or version if modified
beyond ranging; never from a title — a renamed excerpt is the same content, a moved boundary is
not. **Excerpt-local analysis** (R7, R38): demands, range, hand coordination, rhythmic density,
leaps, chord shapes, texture and every difficulty driver are measured on the passage presented
(whole score [A, B, C, D, E]; bars 9–12 [B, C]; eligible by [B, C]) — the difference between
finding a genuinely useful 4–8 bar passage and cropping four bars of an easy piece. **Mining
proposes, never creates truth** (R40): opportunity search → candidate boundaries → machine
scoring → the reviewer sees and hears the passage in context → adjust, reject or approve → a
role → a committed excerpt; scoring weighs the requested opportunity, the absence of untaught or
incompatible demands, phrase, cadence and boundary completeness, pickup integrity, texture and
hand or voice continuity, whether the ending resolves or leads onward, useful length, physical
plausibility, and enough occurrences to practise the claimed thing; never "the lowest-difficulty
window". **Review sees context outside the cut** (R42, G28): the workbench shows and plays
surrounding measures, since bar 1 may continue a phrase, a pickup may be severed, the last bar
may stop before resolution, the accompaniment may start before the melody, a repeat boundary may
change meaning; moving a boundary is an ordinary review action, not JSON editing. **No fork**:
passage proposal, analysis and review join the existing index → shortlist → extract → quarry →
review → commit → build pipeline (R7). **Not PDMX-specific**: the excerpt object serves bundled
repertoire, PDMX, imported MusicXML or MIDI and, later, a learner's project; PDMX is one producer.
**Evidence** keeps the excerpt identity, the source score identity, the exact passage and
version, the judging rung and the measured opportunities and results; it may feed the skills and
never becomes evidence that the whole piece was played or mastered; the repertoire lifecycle
belongs to the whole piece or project unless a design says otherwise (C0a §8 kept).

**Ten adversaries** → Q8: untaught sixteenths in the whole piece and none in the excerpt
(eligible, parent demands unchanged); an easy piece with large leaps only in the passage
(caught excerpt-locally); the lowest-difficulty window starting mid-phrase (rejected or
expanded); ending one bar before the cadence (same); a pickup before the nominal window
(included); the same bars with a different hand or part selection (distinct identity and
demands); an endpoint moved one measure (identity, version and measurements update
deterministically); parent metadata changed without the bytes or passage changing (identity
stable); source bytes or edition changed materially (stale analysis detectable by provenance);
a successful performance crediting the measured opportunities without marking the piece
performed. D supplies compatible demand and quality validators; G consumes approved excerpts.

The reviewer continues into the PDMX genre and bucket machinery against the standing rule that
PDMX genre is useless for pedagogical selection, and whether any of it could leak into E's
content chooser.
