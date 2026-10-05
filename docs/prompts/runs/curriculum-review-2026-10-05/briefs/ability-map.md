# Brief: the ability-cluster remediation map (for review before dispatch, 2026-10-05)

## Decision rationale (operating-procedure §10b)

- **Learner problem.** The 15-track review found abilities a motivated learner would reach and find missing, mistaught or thin: unseen reading beyond key signatures, transposition, ear-to-keyboard production, structural memory and recovery, score study, the left-hand-plus-improvising-right-hand step in blues, the minor ii-V-i and soloing in jazz, the habanera and tresillo stage in latin, composition that never harmonises the learner's own melody, ensemble recovery in jam. Each is a deficiency in a learning experience, not in a document.
- **Solution classes considered.** Fix per track (touching transposition four times months apart); fix per document (the 175 upgrade rows as a task list); build the verification harness first and wire it in later; map abilities to complete learning chains and build what each chain needs. 
- **Chosen path.** The map. It is the packet's own architecture (learner need, musical requirements, best content source, validated for its role, presented, measured honestly) and its development cycle (CONTROL, MODEL/TRANSFER, MUSIC, INDEPENDENCE), and it fixes cross-track strands once. The verifier becomes demand-driven: scoped by what the first clusters need, not by the count of generator families.
- **What would reverse it.** If most MUST abilities turn out to be single-track and single-station, the map adds nothing over the upgrade rows, and the rows are dispatched as they stand.
- **Real problem or proxy.** The proxy would be "rows closed"; the map's finish condition is "every reached MUST ability has all four stations named and supplied".
- **Remaining uncertainty.** Which app modes can honestly serve which stations is read from docs and code, not from running the app; 24 external-benchmark claims still await their primary-source check and are marked.

## Actors (2026-10-05, the owner: delegate by kind of work)

Two agents, not one. **Agent A (fact-gathering):** reads the app code behind the modes once and writes `MODE-SHEET.md` beside the map: per mode, what it does, what it can measure from MIDI, what it cannot, with file:line. **Agent B (synthesis):** writes `ABILITY-MAP.md` from the fifteen records, the upgrade document, the generator addendum and the mode sheet, without reading the app code itself. A script counts the stations. The orchestrator checks the citations that drive wave one.

## The task

Repository: the working branch at its current HEAD. The agent writes exactly one new file, `docs/prompts/runs/curriculum-review-2026-10-05/ABILITY-MAP.md`, changes no other file, runs nothing but read-only scripts, commits nothing, never checks out, stashes or resets. `docs/review/pdmx-dump-2026-10-05/` is someone else's work in progress and is not touched. No AI model is named.

**Read first.** The restart packet sections 2, 3, 5, 7 and 8; the dossier sections 1 and 2; `CURRICULUM-UPGRADE.md` in full (sections 0, 1, 2 and 3 especially); `GENERATOR-ADDENDUM.md` sections 1, 4 and 6; the fifteen track records' sections 2, 3, 8 and 11; `docs/02-curriculum.md` Part G (mastery, review and progression rules) and Part A; `docs/04-ui-spec.md` for the screens and modes; and, for what each mode actually does, `MODE-SHEET.md` (Agent A), itself drawn from the app code behind Today's daily read, the Lab (accompaniment lab and its presets), Jam it, Trading fours, Simon, Free play, Perform, Blind, Loop, Ladder, Duet, Rhythm only, the chord-chart view, note-flash and the dictation drills (start from `app/src/ui/screens/` and `app/src/engine/`, grep for the mode names; read enough to state each mode's honest purpose and what it can measure, no more).

**The source of work is the review, not the generator inventory.** Do not reduce this to the 16 generator rows.

**Write these sections.**

1. **Ability clusters, ordered by severity**, using the packet's priorities: foundational bridge first, then wrong teaching, then weak endpoint, then insufficient acquisition or transfer. Start from this cluster list and change it where the records justify: early reading and sight-reading; rhythm and metre; ear to keyboard production (including transcription); transposition; practice method and score study; harmonic accompaniment (chord symbols, voicings, bass lines, comping); technique foundations; improvisation and composition; performance, memory and recovery; style-specific vocabulary (blues, jazz, latin, ragtime, rock, hymns, holiday as sub-clusters); advanced integration (capstones and projects). Each cluster names the tracks that participate.

2. **One block per MUST ability** (every MUST row of the upgrade that names an ability, grouped into the clusters; SHOULD abilities listed at the end of each cluster in one line each). For each ability:
   - the learner capability in product words, and the records' evidence lines;
   - the four stations: CONTROL (what isolates it), MODEL/TRANSFER (what applies it in a real excerpt, lead sheet or structured task), MUSIC (what piece, accompaniment, improvisation or performance it contributes to), INDEPENDENCE (where the learner chooses it, recovers when it fails, or uses it unprompted);
   - for each station: the actual lesson, the app mode, the drill or generated exercise, the authentic excerpt or piece, or the independent task that supplies it, each marked **EXISTING**, **REPAIR**, **NEW** or **SOURCE-NEEDED**;
   - which station is the one a learner currently falls through;
   - the measurement line: what the app can verify by MIDI at that station, what is self-checked, what no actor here can decide.

3. **Mode responsibility per cluster.** A table per cluster: station, the mode chosen, why that mode and not another, what it measures honestly. Not a universal mapping; a choice per ability. Simon, the Lab, Jam, Free play and Perform must each have a distinct honest purpose (packet section 3, Blocker 3 item 8); where a mode is used for a station it cannot measure, say so and make the station self-checked.

4. **Cross-track strands fixed once.** For sight-reading, transposition, ear production, score study, memory and performance/recovery: the owning cluster, the single place each is built, and the transfer line each other track gets (a requirement, a task or one sentence), per the ownership map in the upgrade; no duplicated lessons.

5. **Derived verification needs.** From the stations marked REPAIR or NEW: which generated families and app drills must be trusted, and therefore which checker each needs (contract, partitura-derived facts, near-miss fixtures), which review corpora go to the outside reviewer, and which imports need the intake gate and a second-edition comparison. State the reusable core this implies (parser, event extraction, contract checking, corpus export) and justify its scope by wave one, not by the family count.

6. **Wave one.** The first clusters to build, chosen by severity and by what unblocks the most stations; each with its own §10b rationale in six lines; each as one seam carrying lesson, mode, drill, excerpt and checker together. Then the later waves in order.

7. **Counts.** MUST abilities; stations EXISTING / REPAIR / NEW / SOURCE-NEEDED; modes used; checkers required; corpora; imports needing the gate. Produced by a script the agent writes beside the file (`count_ability_map.py`), so the totals are counted, not estimated.

Every claim carries its evidence (record section, file:line, a count run). What is observed is marked apart from what a record or report states. Musical-quality statements stay *unverified as music*. Reply in at most twelve lines.
