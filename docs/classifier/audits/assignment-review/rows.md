# The assignment step argued against: every row of ability-characteristics.md (2026-10-08)

**What this is.** The check FABLE.md section 2, item 1b ("Assignment") asks for: one agent argues against the assignments. It covers `docs/classifier/ability-characteristics.md` at bd68c0e3 (232 abilities, 372 rows: 345 assigned parts, 6 parts taught by the lesson, 21 whole abilities taught by the lesson). I did not write it. I read it against `docs/classifier/abilities.md` section 1 and `docs/classifier/characteristics-list.md` section 1 and 1.M. The orchestrator applies the findings and judges them. Nothing in the table above this line was edited.

**How it was checked.**
- **Detection and fit**: read row by row against the ability's title and parameters and against each named characteristic's definition, looking first for an item that would pass without training the ability (a mis-teach), then for one that trains it and would fail. These verdicts are **reading** unless the row says measured.
- **Verified columns**: recomputed by script (`build/rev/recompute.py`, `qcheck.py`, `absent.py`, `unused.py` in this worktree, not committed). They take the weakest marking in characteristics-list.md of every backticked id in each row's detected and fit columns, the agent-question labels each row should carry, the absent-by-family notes and the unused characteristics. **Measured:** 369 of 372 rows reproduce exactly. The three that differ (AB-109 (b), AB-167 (b), AB-188 (b)) carry their chord rows by an "as (a)" reference, and the drafter inherited them correctly. Every PDMX agent question a row needs is named (qcheck.py: no omission beyond the inherited ones). The 69 absent-by-family notes match the detections exactly, and the 19 unused characteristics are reproduced. Section 7's counts reproduce (generated: code 190, code + agent 151, gap 2, missing 2; PDMX: code 27, code (to be validated) 1, code + agent 311, agent 2, gap 2, missing 2).
- **Real items**: a few existing rules (`tools/classifier/rules` at bd68c0e3: pedal-point, four-to-the-bar, shuffle, secondary-rag, stride, oom-pah) were run read-only over the 519 PDMX items of the main checkout's built catalogue, 516 of them readable (`build/rev/run_rules.py`, output `build/rev/rules_out.json`, about 50 s on this machine). Only the rows citing that run are measured. No generated item was run, and nothing was heard.

## General findings (each cited by the rows it touches)

- **G1. "with" read as required.** Section 0 defines "A, with B" as B required too. Several rows use "with" for a supporting or optional signal, and so reject items that train the ability: AB-035 (ties), AB-040 (a), (b), AB-124, AB-142, AB-179 (a), (b), (d), (l), AB-180, AB-183, AB-184 (tenths), AB-195 (a), AB-198. Either reword them to "any of" or "where", or make the signal a level or kind parameter.
- **G2. A figure certified without its style.** Several characteristic definitions say they name "the figure, not the style" (`texture.stride`, `texture.tremolo-thirds`, `texture.crushed-note`, `texture.power-chord`). The run shows the figure rows firing on Classical études: `texture.stride` on 31 PDMX items (Czerny, Lemoine, Chopin, Grieg, Tchaikovsky, Elgar) and the quarter-note `texture.repeated-chords` rule on 23, 11 of them Classical. A style ability whose detection lacks `style.evidence` mis-certifies those items: AB-178 (a), (b), (d), AB-184, AB-171 (b), AB-190 (a) to (c). Style and groove abilities should also locate their supporting figure in the accompaniment part, so that a melody's syncopation never certifies a groove (AB-179).
- **G3. The absent-by-family note overclaims on "any of" rows.** "Code finds no generated fit until one does" is false where another alternative is found on generated items: AB-003 (fingering), AB-005 (a), AB-017 (a), AB-076 (b), AB-134 (b), AB-206 (a). This is wording only, but a curriculum builder reading it would wrongly skip generated items.
- **G4. Stimulus and model confused.** Where the learner supplies the figure (comping, decorating, adapting), some rows require the figure to be already in the item, so only model arrangements fit: AB-110 (a), AB-172 (c), AB-188 (a), (b), AB-196. The stimulus and the model item are two kinds, as AB-151 already separates them.
- **G5. A fingering judgement left unmarked.** AB-018 (changing fingers on a repeated note) needs the same judgement as AB-021 (b) and AB-225 where no fingering is printed (`technique.fingering-demand`, gap), so it is GAP on unfingered items. Section 8's "AB-021 and AB-225 ... the only gap characteristic they need" should add AB-018.
- **G6. The ear abilities' answer key.** See open call 3. This is not a row fault but a condition on every ear row.

## 1. Every row

| AB id (part) | verdict | the correction | evidence |
| --- | --- | --- | --- |
| AB-001 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-002 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-003 | WRONG minor | The note 'code finds no generated fit until one does' is false for this row: the `mark.fingering` alternative finds generated fits (424 of 1,211 generated files print fingering, 1.M). Say the reading-aids alternative has no generated item; the row has. | reading of 1.M's fingering counts |
| AB-004 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-005 (a) | WRONG material | `pitch.black-key-share` 'above none' lets a white-key piece with one F sharp certify finding the black-key groups. Require the item's notes to lie on the black keys (a high share, threshold Phase 2; all black at the black-keys-only stage) or the pre-staff black-key layout. The absent-by-family note overclaims as in AB-003: the pitch route is code on generated items. | reading |
| AB-005 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-005 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-006 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-006 (b) | WRONG minor | Every stepwise melody has minor and major 2nds, so every item certifies 'finding half and whole steps'. Either require the steps to be the item's subject (item.format technical exercise: a step-pattern or chromatic drill), or say that naming them is the lesson's on any item, with `interval.melodic` 2nds as the level parameter. | reading |
| AB-006 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-007 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-007 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-007 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-008 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-009 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-010 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-011 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-012 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-012 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-013 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-014 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-014 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-015 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-015 (b) | WRONG minor | `harmony.rhythm` measures chord changes, not the left hand's interval re-struck on the beat (the same interval re-struck on every beat has no chord change). Use the LH onsets on the beat (`rhythm.bar-patterns` on the LH staff) with `interval.harmonic`. That removes Q-chord and Q-chord-gen: generated becomes code. | reading |
| AB-016 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-017 (a) | OK | Detection is right. Note wording: the absent-by-family note overclaims, because another alternative of the 'any of' is found on generated items (general finding G3). | reading |
| AB-017 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-017 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-017 (d) | WRONG minor | 'Three or more lines' rejects two-voice fugues (WTC I No. 10 in E minor is a two-voice fugue). Use two or more. | reading |
| AB-017 (e) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-018 | WRONG material | `rhythm.repeated-notes` with `technique.velocity` is present in any item with a repeated note (the repeated quarters of Twinkle), and the changing fingers show only in printed fingering, which the row leaves optional. Require `mark.fingering` with different fingers on consecutive equal pitches. Where none is printed, whether the speed needs a finger change is a fingering judgement (`technique.fingering-demand`), so unfingered items are GAP on both pipelines as in AB-021 (b), unless Phase 2 sources a speed threshold. Add AB-018 to section 4 for unfingered items. | reading |
| AB-019 | WRONG minor | The `texture.repeated-chords` alternative includes re-struck half-note chords, which need no wrist bounce or lift. On that alternative, require short values or staccato. | reading |
| AB-020 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-021 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-021 (b) | OK | Right call. Say that the GAP sits only in grading how hard the fingering is (the fit). Detection (a thumb pass or shift with fingering not fully printed) is code + agent, so items can be found; their fingering difficulty cannot be graded. | reading |
| AB-022 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-023 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-023 (b) | WRONG minor | `texture.hands-together` measures whether the hands sound at once, but the first grand-staff pieces alternate the hands. Require notes on both staves (`notation.staves` two, each staff used), not hands together. | reading |
| AB-023 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-023 (d) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-024 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-024 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-024 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-025 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-026 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-026 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-027 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-028 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-029 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-030 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-031 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-032 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-033 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-034 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-034 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-034 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-035 | WRONG material | Section 0 reads 'with' as required, so `rhythm.ties` syncopating kind becomes required. That rejects off-beat accents and rests on strong beats, two of the three kinds the ability names, and the untied eighth-quarter-eighth figure. Make ties a kind and level parameter. | reading |
| AB-036 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-037 (a) | WRONG material | The built `rhythm.shuffle` rule reports present on 'Before You Go' (Lewis Capaldi), a 12/8 pop ballad, by its 12/8 kind, and the row would certify it as swung-eighth training. Require `style.evidence` (jazz, blues, swing or shuffle) for the triplet, dotted and 12/8 kinds; only a printed swing direction (`notation.swing-mark`, the rule's 'marked' kind) stands alone. | measured: build/rev/run_rules.py (the worktree's tools/classifier rules at bd68c0e3) over the 519 PDMX items of the main checkout's built catalogue, 516 readable: rhythm.shuffle present on 10 items, kinds marked 8, triplet 1, 12/8 1; UNKNOWN on 62, the rule's dotted-only case |
| AB-037 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-037 (c) | WRONG material | (1) The detection includes (a), but (a)'s marking was not carried over: it should read code + agent (Qg `style.evidence`) on generated and code + agent (Q `notation.swing-mark`; Q `style.evidence`; Q-hand; Q `mark.tempo-text`) on PDMX, not code / code. (2) Printed off-beat accents are rare in a notated head, so requiring them rejects most swung lines. Make printed accents a level parameter: the phrasing is the learner's on any swung eighth line. | reading: recompute.py follows backticked ids only; (a)'s own ids give code + agent on both pipelines |
| AB-037 (d) | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-038 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-039 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-039 (b) | WRONG minor | Any item with a key signature passes, a major-key piece included. Require `key.tonic-mode` minor under the signature, or a set pairing a major key with its relative minor. | reading |
| AB-040 (a) | WRONG minor | Requiring `reading.accidental-churn` rejects a plain natural that cancels the signature. Make churn a level parameter. | reading |
| AB-040 (b) | WRONG minor | This requires both a carry through the bar and a tie across the bar line. These are two kinds; either one shows the ability, and each is reported apart. | reading |
| AB-040 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-040 (d) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-040 (e) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-041 | WRONG minor | `key.change` includes tonicisations, which are not modulations. Count printed changes and modulations, with tonicisations absent, as AB-205 does. | reading |
| AB-042 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-043 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-044 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-045 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-046 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-047 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-048 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-049 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-049 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-049 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-050 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-050 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-050 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-050 (d) | WRONG material | The unmarked alternative (no slur, no staccato) certifies every unmarked item, including lyrical pieces whose PDMX upload simply omits slurs, so non legato would be taught on music that wants legato. Keep portato (`mark.articulation`) as the item route. Use the unmarked case only for beginner items whose source states non legato (a technical exercise, or a declared recipe), or leave it to the lesson. | reading |
| AB-050 (e) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-051 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-052 | WRONG minor | `style.evidence` is in the fit for every accent, so a Classical accent item is marked code + agent. Make it conditional ('where the style is jazz') so the common case stays code. | reading |
| AB-053 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-054 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-055 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-056 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-057 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-058 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-059 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-060 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-061 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-061 (b) | WRONG material | `technique.written-ornament` (measured notes, no sign) as an 'any of' alternative certifies 'printed ornament signs realised' on an item with no sign. Drop it from (b); it serves AB-222 and plain reading. | reading |
| AB-061 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-061 (d) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-062 | OK | Note: the fit folds `difficulty.expressive` into the row, against section 0's rule that the difficulty gates stay out of the columns. Harmless, but it is the one exception. | measured: build/rev/qcheck.py, the only row naming a difficulty row |
| AB-063 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-064 | WRONG minor | 'All of' requires `mark.expression-text` and an `expression.character` that has two values and is otherwise UNKNOWN (List C), so most pieces are rejected. The ability is generic like AB-065 (any piece); character, text and style are kind parameters. | reading |
| AB-065 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-066 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-067 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-068 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-068 (b) | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-069 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-070 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-071 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-072 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-072 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-073 (a) | WRONG minor | Add the OPEN-12 note. (b) carries it, but (a) depends on OPEN-12 equally (abilities.md AB-073: 'not assessable until OPEN-12'). | reading |
| AB-073 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-074 (a) | WRONG minor | `form.sonata` is first-movement form, but sonatina and sonata movements include rondo finales, minuets and slow movements that are not in sonata form. Detect 'a sonatina or sonata movement' from `meta.title` or `meta.collection`, with `form.sonata` as a kind. The note names `form.sonata` twice. Add the OPEN-12 note. | reading |
| AB-074 (b) | WRONG minor | A complete sonata is every movement of one work (`meta.title`, `meta.collection`), not `form.sonata` 'over several movements', which is a one-movement form. | reading |
| AB-075 (a) | WRONG minor | Add the OPEN-12 note, as for AB-073 (a). | reading |
| AB-075 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-076 (a) | WRONG minor | Add the OPEN-12 note, as for AB-073 (a). | reading |
| AB-076 (b) | OK | Detection is right. Note wording: the absent-by-family note overclaims, because another alternative of the 'any of' is found on generated items (general finding G3). | reading |
| AB-077 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-079 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-080 | WRONG minor | Every item has a compass, so as written every item certifies control across the whole keyboard. Make a wide compass (both extremes of the keyboard used, threshold Phase 2) part of the detection, not only a carried parameter. | reading |
| AB-081 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-082 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-083 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-084 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-085 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-086 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-087 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-088 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-089 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-090 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-091 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-091 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-091 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-091 (d) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-092 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-093 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-094 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-095 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-096 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-097 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-098 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-099 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-100 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-101 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-102 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-103 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-104 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-105 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-105 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-106 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-106 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-107 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-107 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-107 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-107 (d) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-108 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-108 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-108 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-108 (d) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-109 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-109 (b) | OK | 'As (a)' carries (a)'s chord rows, and the marking inherits them correctly. | measured: recompute.py (follows backticked ids only) gives code on generated; (a)'s rows give code + agent, as stated |
| AB-109 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-109 (d) | WRONG minor | 'item.format lead sheet ... where chord symbols are absent' is an empty case: a lead sheet has symbols by definition. The item is a melody alone (`texture.type` monophonic) or a melody staff without symbols. | reading |
| AB-109 (e) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-110 (a) | WRONG minor | `texture.piano-role` 'comping from symbols (no melody)' contradicts the lead-sheet alternative: a lead sheet's written part is a lead line. The comping is the learner's. Detect the stimulus (a chord chart, or a lead sheet, with `style.evidence` jazz) and require piano-role comping only on model comps. | reading |
| AB-110 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-111 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-112 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-112 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-113 | WRONG minor | 'All of' with `harmony.progression` descending fifths rejects the ascending 5-6 kind the ability names. Require the progression for the descending-fifths kind only. | reading |
| AB-114 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-115 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-116 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-116 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-116 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-116 (d) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-117 | WRONG minor | The bass line played back in the LH (RSL Keys G2, G5) is a different kind from the melody. Split it into its own part, so that a melody stimulus never certifies the bass part (abilities.md 8.4). | reading |
| AB-118 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-119 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-120 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-120 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-120 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-121 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-121 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-121 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-122 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-123 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-124 | WRONG minor | Under section 0, 'with `rhythm.backbeat`, `notation.swing-mark` or `rhythm.shuffle`, and `metre.class`' can be read as all required, which rejects Latin grooves (no backbeat, no swing) and rock (no swing). Write 'with any of, by the kind of groove'. | reading |
| AB-125 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-128 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-129 | OK | MISSING CHARACTERISTIC is right. For generated stimuli the alteration is made by the app, so its bars and kind are known by construction and checkable by a diff (code). | reading |
| AB-130 | OK | As AB-129. | reading |
| AB-131 | OK | The detection is right. The renderer condition is real; see open call 3. | reading |
| AB-132 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-133 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-134 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-134 (b) | OK | Detection is right. Note wording: the absent-by-family note overclaims, because another alternative of the 'any of' is found on generated items (general finding G3). | reading |
| AB-135 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-136 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-137 | WRONG minor | Requiring a named `harmony.progression` rejects the cadence-chord stimuli (AB G7: two chords from I, IV, V, V7, vi), which are no named progression. `harmony.roman` with `harmony.chord-quality` is the evidence; the progression is a kind. | reading |
| AB-138 | WRONG minor | Exclude tonicisations from `key.change`: the stimulus must modulate (as AB-205). | reading |
| AB-139 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-140 | WRONG minor | `melody.chord-relation` reads the chord under a note, but the single note comes after the broken triad, with no chord under it. Its member (root, 3rd, 5th) is code from the triad's pitch classes and the note, or the generator's declared answer, not this row. | reading |
| AB-141 (a) | WRONG minor | 'Or `harmony.roman`' lets any progression certify II7 against V7. Require `harmony.applied` V7/V (II7) and V7 as the two stimulus kinds. | reading |
| AB-141 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-141 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-142 | WRONG minor | 'With `rhythm.clave-alignment`' requires a melody agreeing with the clave. Hearing, clapping and keeping the clave needs `texture.clave` only; alignment is AB-185's. | reading |
| AB-143 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-143 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-144 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-145 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-146 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-147 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-147 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-233 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-148 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-149 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-149 (b) | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-150 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-151 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-151 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-151 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-152 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-153 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-154 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-155 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-156 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-157 | WRONG minor | `rhythm.silence` is defined as both hands silent, not rests in the melody hand. Room for fills is long notes or rests in the melody hand (`rhythm.values` per staff, `texture.hands-together` one hand alone). | reading |
| AB-158 | WRONG minor | Requiring `form.thirty-two-bar` or `form.twelve-bar` rejects 16-bar tunes (Blue Bossa, cited by AB-188's ABRSM Jazz G5 source) and other forms. Accept any form whose head and solo section `form.song-sections` shows. | reading |
| AB-159 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-160 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-160 (b) | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-162 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-163 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-164 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-165 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-166 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-166 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-167 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-167 (b) | OK | 'As (a)' carries `harmony.progression`, and the marking inherits it correctly. | measured: recompute.py mismatch explained by the reference |
| AB-168 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-168 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-168 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-169 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-170 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-171 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-171 (b) | WRONG minor | `texture.walking-bass` without `style.evidence` jazz admits a Baroque walking quarter-note bass. Add `style.evidence` jazz (swing) as in (a). | reading |
| AB-172 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-172 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-172 (c) | WRONG minor | The improvised passages are the learner's addition, and a printed piece rarely has `form.improvisation-space`, so 'all of' rejects the stimulus. Detect the printed piece (`item.format` piano score), with improvisation space optional. | reading |
| AB-172 (d) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-172 (e) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-173 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-174 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-175 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-176 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-177 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-177 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-178 (a) | WRONG material | `texture.four-to-the-bar` (the rule for the quarter-note kind of `texture.repeated-chords`) is present on 23 PDMX items, 11 of them classical études and pieces (Czerny Op. 299 Nos. 5, 7, 8; Bertini Op. 29 No. 3; Duvernoy Op. 176 Nos. 8 and 11; Debussy Rêverie). With no style condition, the row certifies a Czerny étude as pop comping. Add `style.evidence` pop or rock (or the accompaniment role over a chart or lead sheet), as (c) has. | measured: build/rev/run_rules.py (the worktree's tools/classifier rules at bd68c0e3) over the 519 PDMX items of the main checkout's built catalogue, 516 readable |
| AB-178 (b) | WRONG minor | The same missing style condition as (a): add `style.evidence` pop or rock. | reading, by analogy with (a)'s measurement |
| AB-178 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-178 (d) | WRONG minor | The same missing style condition as (a): a Classical RH ostinato would certify pop patterns. Add `style.evidence` pop or rock. | reading, by analogy with (a)'s measurement |
| AB-179 (a) | WRONG minor | 'With A or B, C, D' makes repeated eighths and power chords required, but most rock piano parts have no power chords. Make the supporting rows 'any of', and locate them in the accompaniment part. | reading |
| AB-179 (b) | WRONG minor | Repeated chords, a four-chord loop and `texture.build` are all required. Make them any of, located in the accompaniment part. | reading |
| AB-179 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-179 (d) | WRONG minor | Walk-ups, crushed notes and arpeggios are all required. Make them any of. | reading |
| AB-179 (e) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-179 (f) | WRONG material | R&B rests on `style.evidence` plus subdivision syncopation anywhere in the item, which the melody of a plain melody-and-chords arrangement of an R&B song has; the groove is then certified from the label. Require the syncopation in the accompaniment part (`texture.piano-role` comping, or the LH), and add extended qualities (`harmony.chord-quality` 9, 11, 13) and `texture.crushed-note` as supporting rows. Otherwise mark MISSING CHARACTERISTIC (an R&B comping figure). | reading |
| AB-179 (g) | WRONG minor | Locate the subdivision syncopation, the off-beat chords and the riff in the accompaniment part. The rows are otherwise adequate for funk. | reading |
| AB-179 (h) | WRONG minor | Locate the octave bass and the repeated eighths in the accompaniment part. With both required, the rows are adequate for disco. | reading |
| AB-179 (i) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-179 (j) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-179 (k) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-179 (l) | WRONG minor | Applied chords and walk-ups are both required. Make them any of. | reading |
| AB-179 (m) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-180 | WRONG minor | This requires `item.format` piano part with other instruments, but the backing track is the app's, so solo riff items fail. Make it optional. | reading |
| AB-181 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-181 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-182 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-182 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-183 | WRONG material | `rhythm.secondary-rag` is absent (exact) on Joplin's Search-Light Rag and Scott's Frog Legs Rag and UNKNOWN on 168 items, and `form.multi-strain` is also required (absent by the family list on generated items). Together they reject Joplin's rags and his School of Ragtime exercises, the ability's own source. Make both kind parameters. | measured: build/rev/run_rules.py (the worktree's tools/classifier rules at bd68c0e3) over the 519 PDMX items of the main checkout's built catalogue, 516 readable: secondary-rag present on 4 (12th Street Rag, Memphis Blues and 2 non-rags), absent on Search-Light Rag, Frog Legs Rag, Alexander's Ragtime Band, Tiger Rag |
| AB-184 | WRONG material | `texture.stride` is present on 31 PDMX items, among them Czerny Op. 299 Nos. 5, 6, 8, Lemoine Op. 37 Nos. 35 and 50, Chopin Op. 15 No. 2, Grieg, Tchaikovsky's October and Elgar's Salut d'amour. Its definition says 'the figure, not the style', and this row names `style.evidence` only in the fit, so a Czerny étude certifies stride. Add `style.evidence` stride (or ragtime or jazz) to the detection. Make tenths a kind, not required ('bass notes or tenths'). | measured: build/rev/run_rules.py (the worktree's tools/classifier rules at bd68c0e3) over the 519 PDMX items of the main checkout's built catalogue, 516 readable |
| AB-185 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-186 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-187 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-187 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-187 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-187 (d) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-187 (e) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-187 (f) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-188 (a) | WRONG material | A lead sheet has no written accompaniment, so `texture.bossa` (the comp) cannot be in it; 'all of' finds only partly accompanied lead sheets. Detect the stimulus as a lead sheet with `style.evidence` bossa nova (title, genre label), and `texture.bossa` only on model comps. | reading |
| AB-188 (b) | WRONG material | Likewise with `texture.latin-pattern` samba. | reading; recompute.py mismatch is the 'as (a)' reference, inherited correctly |
| AB-189 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-189 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-190 (a) | WRONG minor | Marcato en 4 (repeated accented quarter chords) is a generic figure. Without `style.evidence` tango, the row certifies a march or Classical piece as tango. Add it, as (d) has. | reading |
| AB-190 (b) | WRONG minor | Add `style.evidence` tango, as (d) has. | reading |
| AB-190 (c) | WRONG minor | 3-3-2 is the tresillo, common in pop. Without `style.evidence` tango, a pop song certifies the tango figure. Add it. | reading |
| AB-190 (d) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-191 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-191 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-191 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-192 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-192 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-192 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-192 (d) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-192 (e) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-192 (f) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-193 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-193 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-194 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-195 (a) | WRONG minor | Requiring `rhythm.silence` rejects accompaniments that play throughout. Make it optional. | reading |
| AB-195 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-234 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-196 | WRONG minor | Decorating a hymn starts from the plain hymn. The stimulus is `item.format` hymn with plain diatonic harmony; `harmony.applied` and `texture.bass-walk-up` describe model decorated arrangements. As written, only already-decorated items fit. | reading |
| AB-197 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-198 | WRONG minor | Requiring `rhythm.silence` rejects primo and secondo parts that play throughout. Make it optional. | reading |
| AB-199 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-199 (b) | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-200 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-202 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-202 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-202 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-202 (d) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-204 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-204 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-204 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-205 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-206 (a) | WRONG minor | `form.sections` alone (any double bar or repeat) certifies AB or ABA form on a through-composed piece with a double bar. AB and ABA need `form.binary-ternary`; `form.sections` only locates the sections. The absent-by-family note also overclaims (general finding G3). | reading |
| AB-206 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-206 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-206 (d) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-206 (e) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-207 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-208 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-209 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-210 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-211 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-212 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-213 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-214 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-215 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-216 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-217 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-217 (b) | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-218 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-219 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-219 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-219 (c) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-220 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-220 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-221 | WRONG material | `texture.pedal-point` is present on 111 of the 516 readable PDMX items, including Bach Inventions Nos. 3, 7, 9 and 10, Clementi Op. 36 No. 1 (third movement) and Burgmüller Op. 100 No. 3, none of which calls for the sostenuto pedal. A repeated bass, or one the hand can hold, needs no sostenuto. Keep `mark.pedal-kind` sostenuto. For unmarked items, require a held bass the hand cannot keep (`technique.pedal-implied`'s second reason) under unpedalled hands above (staccato or rests, `mark.pedal` absent). | measured: build/rev/run_rules.py (the worktree's tools/classifier rules at bd68c0e3) over the 519 PDMX items of the main checkout's built catalogue, 516 readable |
| AB-222 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-223 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-224 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-225 | OK | Right call (GAP on items printing no substitution). | reading |
| AB-226 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-227 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-228 | OK | - | reading: agree that no score property separates an item that trains it from one that does not |
| AB-229 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-230 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-230 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-231 | WRONG minor | This is inconsistent with the ear call: the app's playback of a song score is as much a stimulus here as for AB-117, AB-119 and AB-120. Either assign the finding of tonic, bass, chords and tune through those rows on a song score (`key.tonic-mode`, `harmony.bass-behaviour`, `harmony.roman`, `texture.melody-location`) and keep only the real recording and playing along as the lesson's, or state why a played score cannot stand in. | reading |
| AB-232 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-235 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-236 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-237 | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-238 (a) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
| AB-238 (b) | OK | - | reading (detection and fit); measured (marking: recompute.py reproduces the weakest marking) |
## 2. The drafter's open calls (sections 0 and 8)

| call | verdict | reason |
| --- | --- | --- |
| The checks every fit needs (difficulty, `integrity.notation-sanity`, `quality.coherence`, `quality.idiomatic`) kept out of the per-row columns | OK, with a correction | They are the same for every row, so stating them once is right. But the quality gates are code + agent on both pipelines, so **no fit is code from end to end**. Section 7's "code 190" (generated) means the row's own detection and fit rows only. Say so beside the counts, so that no one reads "code" as "no agent needed for this ability". AB-062 is the one row that folds a gate (`difficulty.expressive`) into its columns, which is harmless. AB-046 and AB-065 are generic: their fit is mostly the gates, so their marking understates the agent's share. Reading. |
| "Verified" means the item is a fit, not that the learner played it | OK | This follows from the owner's ruling that there is no listening model (owner facts), and section 0 states it plainly. A later phase may misread the column header as assessment; "fit established by" would be safer. Reading. |
| Ear abilities assigned through the score the app plays | OK, with two conditions (material) | (1) **The renderer.** The answer is right only if the app's playback sounds what the rows read: dynamics, articulation, tempo changes, swing, pedal. No one in this process hears it, but code can check it on the app's playback events (velocities, gate times, swing ratio, pedal events) against the score's marks. Until that check exists, the ear rows that read marks (AB-124 swing, AB-131, AB-133 character, AB-132 harmonised) rest on an unchecked renderer. The orchestrator should record this as an item, not a characteristic. (2) **The answer key.** For an ear item the row's marking is the answer key. Where it is code + agent (the chord, key, cadence or modulation through Q-chord, Q-key or Q `key.change` on PDMX, and Q-chord-gen on generated items), an agent error marks the learner's right answer wrong, which teaches wrong. Ear stimuli should be restricted to items whose answer code establishes (generated items with a declared progression or cadence that the notes confirm, or PDMX items where code and the agent agree), and no UNKNOWN or low-confidence item should ever be a stimulus. AB-132 already excludes ambiguous keys; the rule belongs on every ear row. AB-231 is inconsistent with this call (its row). Reading. |
| OPEN-12 as a note, not a GAP | OK as not-GAP, WRONG minor as placed | It is not a GAP by the project's own definition: abilities.md section 6 calls open research items "not gaps", and a gap is what code and agents cannot establish. Here identification is established, and what is missing is a research answer. But the owner's completion test ("fully ... chosen as a fit") is not met for these parts, because their fit is graded by identity only. List them in their own section beside section 4, so the orchestrator sees them: AB-073 (a), (b), AB-074 (a), (b), AB-075 (a), (b), AB-076 (a), (b), AB-079. Put the note on the (a) parts too, which lack it. Reading. |
| AB-179's R&B, funk and disco parts on general rows under `style.evidence` | R&B WRONG material; funk and disco WRONG minor | Funk's rows (subdivision syncopation, off-beat chords, a riff) and disco's (octave bass with repeated eighths) describe the groove well enough, if they are located in the accompaniment part. R&B rests on the label plus syncopation anywhere, which the melody of a plain melody-and-chords arrangement has. Add extended chord qualities and crushed-note slides and locate them in the accompaniment, or mark MISSING CHARACTERISTIC (an R&B comping figure). Reading. |
| item.variant-diff as MISSING CHARACTERISTIC (AB-129, AB-130) | OK | No row compares two items, so the call is right. For generated ear stimuli the alteration is made by the app, so the diff is known by construction and checkable as code (`generated.spec-declared` plus a score diff). Whether a two-item property belongs in a list of an item's characteristics is the list owner's decision. Reading. |
| The 19 characteristics no ability uses | OK | Reproduced by script (unused.py: the same 19). Each reason holds. `generated.spec-declared` should be named as the declared answer key for generated ear stimuli (open call 3), a use the section 6 reason does not mention. Measured (the list), reading (the reasons). |
| AB-021 (b) and AB-225 the only GAPs | WRONG minor | AB-018 has the same gap on unfingered items (G5). For AB-021 (b) the gap is in grading the fit, not in detecting the item (its row). Reading. |

## 3. Counts (by `build/rev/make_rows.py` over the table above)

- Rows: 372 = 345 assigned parts + 6 parts taught by the lesson + 21 whole abilities taught by the lesson (the drafter's 351 parts plus the 21).
- Verdicts, all rows: OK 309, WRONG material 14, WRONG minor 49, UNSURE 0 (sum 372).
- Assigned parts (345): OK 283, WRONG material 14, WRONG minor 48. Taught by the lesson (27): OK 26, WRONG minor 1 (AB-231).
- By ability, the worst verdict of its rows (232): OK 183, WRONG material 12, WRONG minor 37.
- WRONG material rows (14): AB-005 (a), AB-018, AB-035, AB-037 (a), AB-037 (c), AB-050 (d), AB-061 (b), AB-178 (a), AB-179 (f), AB-183, AB-184, AB-188 (a), AB-188 (b), AB-221. Five of them rest on the rule run (AB-037 (a), AB-178 (a), AB-183, AB-184, AB-221); the rest are readings.

## 4. Not done

- Only six existing rules were run, on PDMX items only; no generated item and no other row was tested on a score. Every verdict not marked measured is a reading of the definitions.
- An OK verdict means I found no counterexample by reading, not that the row was proved on items.
- The rules run uses rules whose own validation is partial (characteristics-list.md 1.M). A rule that fires on a Classical étude shows the row's need for a style condition; it is not a claim about the rule's accuracy.
- The renderer check and the answer-key restriction (open call 3) are proposals for the orchestrator. Nothing here was heard.
