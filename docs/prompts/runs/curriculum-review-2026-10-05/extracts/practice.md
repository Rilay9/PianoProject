######## practice
## 2. Current coverage

| Ability | Where taught (file:line) | CONTROL | MODEL / TRANSFER | MUSIC | INDEPENDENCE |
| --- | --- | --- | --- | --- | --- |
| Chunking and looping | `practice.1.md:17-35` (smallest unit, the bar before the break, play the next note too, five clean in a row); `0.3.md:35-37` (loops) | the loop on the rung's exercise options (`stage-1.json`: five-finger RH, steps-and-skips, rhythm drill) | Hot Cross Buns, Ode to Joy RH (`stage-1.json` `songOptions`) | none in the track | `practice.1.md:43-44` "starting cold, and join it to the bar on either side" (self-checked); the unit's own requirement is `unjudged` "Use the method on a passage of your own" |
| Slow practice, tempo ladder | `practice.2.md:12-35`; app tool `practice.2.md:37-43`; `0.3.md:31-33`; reused as a tool at `4.1.md:45`, `4.2.md:45`, `4.3.md:55`, `4.4.md:60`, `blues.6.md:54`, `classical.5.md:61` | Ladder on a loop | Ode to Joy RH; later scales and Hanon | not in the track | `practice.2.md:45-46` "three tempos on request" is partly app-measurable (accuracy at tempo %), the rest self-checked |
| Session shape, interleaving, review | `practice.3.md:12-46`; `0.3.md:39-46` (review; 30-minute template) | the review row and Today's daily sight-read (`practice.3.md:33-37, 43-46`) | none beyond that | none | `practice.3.md:48-49` "A week after learning something, it is still there": checkable by the review queue, not by a run |
| Warm-up, tension, pain | `practice.4.md:12-41`; `4.4.md:32` ("Never play through pain") | slow warm-up, tension checks | five-finger / Hot Cross Buns substrate | none | stop at pain and rest (`practice.4.md:31-37`); the habit is self-reported |
| Plateau diagnosis and the three changes | `practice.5.md:12-51`; app rule `app/src/engine/drills/coaching.ts` (`PLATEAU_RUNS = 3`, `PLATEAU_LESSON = 'practice.5'`) | tempo, key, order, plus Rhythm only / Blind (`practice.5.md:40-51`) | Ode to Joy RH; G-major five-finger | none | the strongest INDEPENDENCE item in the track: choose a cause, change one variable (`practice.5.md:36-43`) |

- **Observed pattern:** the track is a CONTROL and INDEPENDENCE sandwich over very small MODEL material. No rung reaches MUSIC; that is intended for a method track.
- **Fragments of the dossier's missing abilities that live in other lessons** (the gap claims in section 3 depend on these):
  - Retrieval and starting anywhere: `4.7.md:27-31`, `4.7.md:47-49, 56-57`; `4.6.md:39-41`.
  - No-stopping and recovery: `4.6.md:23-27, 43-46`; `1.5.md:42-47`.
  - Transitions and sections: `classical.6.md:43`, `classical.7.md:31`, `classical.9.md:25-31`.
  - Record and listen: `3.6.md:44`, `blues.4.md:52-53`, `blues.9.md:26-29`, `improv.3.md:37-40`, `improv.5.md:39-43`.

## 3. Missing or weak abilities

Searches below ran over all 109 files in `content/lessons/` (`ls content/lessons | wc -l` returned 109), case-insensitive, listing files only. The practice files were also read in full. Patterns used: `interleav`, `spac(ed|ing)`, `retriev`, `cold`, `memoris|from memory|by heart`, `record`, `no.stopping|without stopping|keep going|recover`, `perform`, `structur|section|landmark`, `blocked`, `retention|consolidat`, `play.through|run.through`, `hands separately`, `the same mistake|unchanged|change one`, `transpos`, `backwards|transition|joins`.

**3.1 Acquisition versus retention, as a general idea: partly present, not named.** Dossier claim A.
- Present, only inside the interleaving frame: `practice.3.md:12-14` ("some of that climb can be gone by tomorrow") and `:16-19` (interleaving "feels worse... can still help what you keep a week later").
- Not stated anywhere as "feeling fluent now is not evidence you will have it tomorrow". Grep `retention|consolidat` finds only `practice.5.md` (as "consolidating", a plateau cause). `retriev` finds nothing in `content/lessons/`.
- Why it matters: it is the idea that lets a learner distrust a good session. Evidence: Soderstrom & Bjork 2015 (learning versus performance); Duke et al. 2009 (abstract summary).
- Severity: depth.

**3.2 When blocked practice is legitimate: absent as a statement, though practice.1 prescribes blocked repetition.** Dossier claim B.
- `practice.1.md:25-31` has the learner repeat one chunk until five correct in a row, which is blocked practice. `practice.3.md:26-28` then says to come back to the hard thing twice and calls the second visit where the learning happens. No sentence reconciles the two.
- Grep `blocked` in `content/lessons/` hits only `chords-pop.4.md:34` and `holiday.4.md:25`, both about "blocked-out chords", not practice schedules.
- External evidence that the schedule question is genuinely mixed:
  - Carter & Grahn 2016 (10 advanced clarinetists, 24-hour retention): interleaved rated better, but significant for one rater only on both task types; the authors cite earlier studies with no effect of schedule on technical accuracy.
  - Stambaugh 2011 (41 beginner clarinetists, abstract summary): no significant accuracy, speed or evenness difference at the end of practice; the random group played faster at retention.
  - Mathias & Goldman 2025 (20 advanced violinists, secondary summary only, abstract not read): no effect at acquisition, and blocked best at 24-hour retention.
  - Simmons 2012 (60 musicians, 13-note piano melody, ERIC summary): sleep-based consolidation helped accuracy; speed gains appeared in groups whose sessions were separated by 6 and 24 hours.
- The accurate position is "it depends, and the evidence in music is small-sample and inconsistent". The dossier's own statement that "blocked can outperform interleaving for delayed retention on difficult excerpts" is supported only by the Mathias & Goldman secondary summary in what I could retrieve; treat it as plausible, not established. Severity: depth. It is also the correctness item in 5.1.

**3.3 Retrieval and cold starts: in the core path at Stage 4 and absent from the practice track.** Dossier claim C.
- `practice.1.md:44` has one "starting cold".
- The real treatment is `4.7.md:29-31` ("Be able to begin at bar 9, at bar 17...") and `4.7.md:56-57` ("start anywhere, at half tempo, without the page"), plus `4.6.md:39-41`.
- The word "cold" appears only in `3.4.md:17` (a different sense) and `practice.1.md:44`. A Stage 1 learner on the practice track gets nothing like it until 4.7.
- Evidence it belongs in a competent curriculum: Chaffin & Imreh 2002 (formal structure used as a retrieval scheme, abstract summary).
- Severity: depth. The gap is scoped as "not in the practice track; present in core 4.6, 4.7 and classical.9".

**3.4 Structural practice: absent from the practice track.** Dossier claim D.
- `practice.1.md:21-24` chooses units by where the learner stumbles, not by phrase or section. The structure-based idea appears first in `4.7.md:47-49`, then `classical.6.md:43`, `classical.7.md:31`, `classical.9.md:25-31`.
- Chaffin & Imreh 2002: practice was organised by musical structure and started and stopped at phrase boundaries; "switch points" were targeted (abstract summary).
- Related heuristic-as-law: `practice.1.md:17-19` ("Not a line, and never a page") fixes chunk size at one or two bars. Williamon & Valentine 2000 (22 pianists learning Bach, abstract summary): quantity of practice did not relate to performance quality, and pianists using longer practice segments by the middle stage performed better. It is correlational, and a Stage 1 learner on four-bar tunes is not the sampled population, so this is a "stated more firmly than the evidence" note, not a refutation.
- Severity: depth.

**3.5 Record and listen: absent from the practice track, present elsewhere.** Dossier claim E.
- No `practice.*` file mentions recording or listening back (practice files read in full). Elsewhere: `3.6.md:44` ("Record yourself; it is worse than you think"), `blues.4.md:52-53`, `blues.9.md:26-29`, `improv.3.md:37-40` and `improv.5.md:39-43` (the in-app *Listen back* on backing-track drills).
- So the technique is taught as scattered one-liners and one app feature, never as a practice tool for any piece.
- Severity: enrichment to depth. Whether a given recording is musically good is *unverified as music*; nobody in this process hears it. The gap is only that the learner is never told to use recording as a practice method.

**3.6 No-stopping performance practice: absent from the practice track, present in core.** Dossier claim F.
- `4.6.md:23-27` ("Keeping going... deliberately drop a note and carry on in time") and `4.6.md:43-46` (*Perform*: one pass, no restarts, no loop); `1.5.md:42-47` for reading. *Perform* is also named at `holiday.6.md:17`, `holiday.7.md:31`, `hymns.6.md:50`, `latin.7.md:51`, `ragtime.9.md:56`.
- Neither `practice.3` nor `practice.4` nor `practice.5` mentions it. The first taught use is Stage 4.
- Severity: depth.

**3.7 Changing strategy after unchanged failure: largely present; the dossier's claim is overstated.** Dossier claim G.
- `practice.5.md:40-43` names tempo, key, order. `:45-46` ("Doing the same practice more intensely") is the common mistake. `:48-51` adds attention (*Rhythm only*, *Blind*). `:27-29` covers fingering ("decide the fingering deliberately"). `practice.1.md:33-35` covers unit size and tempo. `0.3.md:27-29` covers hands separately.
- The dossier's list is tempo, unit size, hand, rhythm, fingering/physical approach, context, task. Each has at least one line in the folder.
- What is missing is only an explicit rule such as "after about three unchanged tries, change something". The app has one (`coaching.ts` `PLATEAU_RUNS = 3`, which links `practice.5`), and `practice.5.md:12-14` gestures at it.
- Severity: enrichment.

## 4. Sequencing concerns

1. **Transposition is used before it is taught** (`practice.5.md:41-43` tells a Stage 1 learner to "transpose it").
   - Transposition is first taught at `4.4.md:39` and `chords-pop.3.md:35`.
   - Not a dead end: the rung's own options include `exercise.five-finger.g-major.both` and *Ode to Joy* RH, and from the notation `song.classical.ode-to-joy.rh` spans C4-G4 (dump bars 1-8). Up a fifth it sits in G-D, which is all naturals, so a transposition exists that needs no new accidentals.
   - But the lesson gives no how-to and no interval. Severity: low (usability).
2. **The track assumes a pool of material the learner does not have at Stage 1.**
   - `practice.1` opens at 1.1 (`docs/02-curriculum.md` D8a). Its finder asks for a "16 to 48 bars" piece with "one clearly harder passage" (`stage-1.json` `finder`), but every shipped option is tiny: Hot Cross Buns is 4 bars, three pitches (dump); Ode to Joy RH and Mary are 8 bars of quarter-note steps (dumps).
   - The rung's own "find where it breaks" step therefore depends on the learner's own book (`paperHint`) and is unjudged (`requirements: unjudged / method-applied`).
3. **The track is chained linearly** (`prerequisites`: practice.2 to practice.5 each name the one before). The order chunk, slow, session, stop, plateau is defensible. One inversion worth recording: *when to stop* (pain, `practice.4`) is fourth, after the learner is told to loop and to climb tempo (`practice.1`, `practice.2`). `practice.4.md:39-41` and `0.3.md:48-49` and `4.4.md:32` carry some of it elsewhere, and nothing is gated on it. Severity: low.
4. **Ordering conflict inside `0.3`:** `0.3.md:41` says "Do [review] first in a session, not last"; `0.3.md:43-46` gives a template starting with 5 minutes technique, then 5 of review; `practice.3.md:21-25` has "warm up... then two or three things". Three readings of the order. Severity: low (see section 12).

## 6. Practice and material sufficiency

- **Controlled practice:** each rung's runs requirement is one run of one exercise (`stage-1.json`: `{'kind':'runs','from':'exercises','count':1}`), and the method requirement is `unjudged` ("No run records which way of practising was used"). So the app credits a run, and whether the learner used the method is never checked. Mastery thresholds are accuracy 0.8 and tempo 0.7 on all five practice rungs, against 0.9 and 0.8 on core 1.1-1.5 (`stage-1.json`).
- **Revisiting:** the ability is revisited downstream. The Ladder reappears as a tool at `4.1-4.4`, `blues.6` and `classical.5`. *Rhythm only* and *Blind* return at `4.5` and `4.7`. Plateau coaching links back by app rule. Chunk and loop is not explicitly reused after Stage 1 lessons, though `classical.9.md:25-31` is a long-form version.
- **Material, 425 CSV rows (all `practice.*`, 7 placements):**
  - `practice.1`: Hot Cross Buns, Ode to Joy (theme).
  - `practice.2`: Ode to Joy (theme).
  - `practice.3`: Hot Cross Buns, Mary Had a Little Lamb.
  - `practice.4`: Hot Cross Buns.
  - `practice.5`: Ode to Joy (theme).
  - All carry `KEEP / REVIEW_SUBSTRATE`. I accept that: familiar material is the right substrate for a method lesson, and nothing is confused with project material.
  - My observation is a sufficiency one the audit does not make: a 4-bar, 3-pitch tune cannot present a break to diagnose (`practice.1.md:21-24`), and no shipped item can produce a plateau (`practice.5`). The track's transfer therefore rests on the learner's own repertoire, which the finder and `paperHint` text say outright.
- **Generated families:** none in this track's options beyond the existing drills (rhythm, five-finger, scale); I did not enumerate generator families and noticed no thin one.

## 8. Recommended changes (ranked)

1. **Fix `practice.3.md:26-28`.**
   - *Problem:* a categorical claim the evidence does not support.
   - *Smallest change:* replace the sentence with a hedged one, for example that returning to a hard passage after something else is one thing worth trying, and that the research on this in music is mixed.
   - *Add:* two sentences naming that repeating one chunk (as `practice.1` teaches) is a legitimate way to stabilise a new movement, and that practising feels better now than it helps tomorrow (acquisition versus retention).
   - *Evidence:* sections 3.1, 3.2, 5.1. *Deletes:* the overclaim. *Type:* fix.
2. **Add a cold-start check to the practice track** (a line in `practice.3`, or the "How you'll know" of `practice.5`): next day, play it first, before warming up, and note what slipped.
   - *Problem:* retrieval is only taught at Stage 4.
   - *Smallest change:* one line plus a pointer to `4.7`. *Evidence:* 3.3. *Type:* fix (depth).
3. **Scope out, or add as a later short unit:** whole-piece practice (structure, joins, play-through, record) collecting fragments that already exist at `4.6.md:23-27`, `4.7.md:27-31`, `classical.6.md:43`, `classical.9.md:25-31` and `improv.3.md:37-40`.
   - *Problem:* the practice track ends at Stage 1 and the learner who reaches long pieces gets these ideas in scattered form.
   - *Smallest change:* a single pointer paragraph in `practice.5`, or one optional later unit with 4.7 as prerequisite. *Type:* scoped-out gap or new unit, builder's call.
4. **Soften `practice.1.md:17-19` ("never a page")** to a scaling statement: units follow phrases and grow with experience. *Evidence:* 3.4. *Type:* fix (low).
5. **One clause in `practice.5.md:41-43` on how to transpose a five-finger tune** (move the pattern by the same interval; Ode to Joy RH sits in G-D with naturals only), or flag that it is easier after `4.4`. *Evidence:* section 4 item 1. *Type:* fix (low).
6. **Do not add ten rungs.** The dossier's "very high" priority is justified for the schedule claim (item 1) and for the retrieval idea (item 2). Most of the remaining dossier items are already present or live in core.

## 11. Cross-track abilities (A to F)

- **A. Sight-reading strand:** touched only as a scheduling note. `practice.3.md:43-46` says *Today*'s daily sight-read sits outside the session card; no reading development in this track.
- **B. Transposition:** touched once, as a strategy (`practice.5.md:41-43`), before it is taught (`4.4.md:39`, `chords-pop.3.md:35`); see section 4.
- **C. Memory as structure plus retrieval:** retrieval partly touched (`practice.1.md:44`, `practice.3.md:33-37` spaced review); structure not touched in this track. The structure plus start-anywhere treatment is `4.7.md:27-31`.
- **D. Ear training with production:** not touched by this track.
- **E. Score study before playing:** not touched by this track (`practice.1.md:21` is find-the-break by playing, not inspection).
- **F. Performance and recovery:** not touched by this track. Carried at `4.6.md:23-27, 43-46`.

