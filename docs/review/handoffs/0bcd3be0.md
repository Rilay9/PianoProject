# Reviewer handoff — L120a: the table of the rung-own options the gate reads as untaught (Entry 149)

Implementation HEAD: 0bcd3be0 (merged at 1b8d40c3; the entry and this handoff in the record commit at HEAD). Respond in `responses/0bcd3be0.md`. L120a on the reviewer's gate (`responses/questions-4dc2f135.md`: the read-only table first, under the order material reading → teaching ownership → placement); a narrow fix-forward under 788427c, dispatched with a for-information line.

## What is asked

Whether the table is the diagnosis you asked for before any correction: the same gate reading as the app's (pinned line for line to the app's probe at this head), each pair with its measurement verdict, concept mapping, teaching ancestry and placement context, classed under your order with incidental presence recorded and never an exemption; the two judgement calls the builder made in the tool (nineteen lesson mentions read as not teaching; three reading doubts classed A); and your answers to the three questions below, which decide L120b's corrections.

**The table, pinned to the app.** At this head the app's gate refuses 389 rung-own options as untaught — X1's 387 plus the two options Q76 added (*Cielito Lindo (simple)* at 2.4, *Pine Apple Rag* at ragtime.8); the build's table holds 388 of them with the same demands in the same order, and lists the 389th (2.2's right-hand sight-reading row, whose demands come from the app's reading controls) separately as *not read*. 641 option × demand pairs. By your order: **A 14** (the material reading in doubt — key signatures the detector places on no sounding note, 3/8 read as compound, written sixteenths in 3/8), **B 110** (a lesson at or below teaches it and does not declare or map it: 43 claim, 67 mapping), **C 517** (no lesson at or below names it: 246 taught later on the path, 134 taught only elsewhere, 137 taught nowhere). By option: reading 4, ownership 76, placement 308. Incidental presence is recorded, never an exemption: 382 pairs established, 259 incidental, 107 options carrying only incidental demands stay in the table.

**What a learner meets** (read from notation and lesson text; unverified as music). *Hot Cross Buns* at 0.3 carries a bar of eight eighths and one skip, with Keep tempo asked at 60 %; steps are first claimed at 1.1, the skip at 1.5, eighths at 2.2, and nothing at 0.1–0.3 names any of them. Stage 1's songs (*Mary*, *Merrily*, *Au Clair*, *Lightly Row*, *Frère Jacques*) carry skips, leaps, eighths and a position shift before the rungs that teach them; 1.5's own text says *Up to now you have read notes by name*. The practice floor stands on 1.1 and 25 of its 26 untaught pairs are taught only on core rungs off its path (L125). **Sixteenths are taught nowhere** while the core asks them from 3.5 (*Canon in D*, easy) and 4.4 (Hanon 1–5): 207 options, for 165 the only untaught demand; 67 of those pairs sit on ragtime, technique, latin.7 and holiday.7 rungs whose lessons name and drill sixteenths without a concept row (L123, P1). Syncopation: 125 options, taught at 4.5 and latin.3; 36 on `classical.4.shelf`, whose path reaches neither.

**Two judgement calls the builder made in the tool, each in the code with its reason** (for you to keep or overturn before L120b reads the table): nineteen lesson mentions read as *not teaching* the demand (middle C's own ledger line, *syncopated pedalling*, the placement test's task list) — without those readings 197 C pairs would count as B; and three reading doubts classed A rather than C.

**Three questions for L120b.** (1) Is a skip inside a taught five-finger position, read by letter name, untaught? It decides 19 skip pairs, and whether the coping question reads a demand by its notation or by the skill trained for it. (2) Are the A readings the detector's to change — 3/8 read as compound, key signatures located nowhere, written sixteenths in 3/8? (3) Do the ragtime, technique, latin.7 and holiday.7 lessons own sixteenths (a concept row where they teach them), and which core rung is the honest teaching owner?

**A premise of the brief corrected.** `CONCEPT_DEMANDS` has no row for the four demands the brief named, but `concepts_naming`, from which `taughtAt` is built, maps triplets and `range.beyond-position` through skills; only sixteenths is taught nowhere.

**Fragile by design, said.** The shipped comparison pins X1's probe as a snapshot: it goes red on any change to a rung list, a row's demands or `taughtAt`, and the fix is to re-run the kept probe script and record the difference (L124).

**Each judgement shown on its own, as you asked.** The nineteen lesson mentions read as not teaching are the nineteen entries of `READ_NOT_TEACHING` in `tools/content/untaught_options.py` (from line 162), each keyed by rung and demand with the sentence read and why it does not teach; the three reading doubts are the three cases of `reading_doubts` (from line 114: a key signature the detector places on no sounding note, 3/8 read as compound, written sixteenths in 3/8); and the table prints each beside the pair it decides — the `read as not teaching it:` and `doubt:` lines under the pair in `runs/L120a/untaught-options.txt`. Each is yours to keep or overturn before L120b reads the table.

## Files to inspect

`docs/prompts/entry-149.md`; `docs/prompts/runs/L120a/untaught-options.txt` (the table, its summary and per-demand counts); `tools/content/untaught_options.py` (the classes and the not-teaching readings, each with its reason); `tools/content/tests/test_untaught_options.py` (the pin to the app's probe and the constructed classes).

## Not done, with the reason

See the entry's Not done lines.

## Do not re-review

X1 as accepted (`responses/aed824a1.md`); every closed seam.
