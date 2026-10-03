# Reviewer handoff — G85: the Library shows the project state and opens the one sheet (Entry 147)

Implementation HEAD: ba4c6fea (merged at 760b8f61; the entry and this handoff in the record commit at HEAD). Respond in `responses/ba4c6fea.md`. Your ruling 3 on the G1b brief (`responses/a96395d.md`): the Library may expose the same project state and open the same sheet, consuming the one store; a narrow fix-forward under 788427c, dispatched with a for-information line.

## What is asked

Whether the Library consumes the one `projectStore` truth and no more: the badge in `PROJECT_TEXT`'s words only where a project exists, the row's door opening the same sheet Progress and the Score screen open, the *Project* filter reading it as `status` is read, one store read per draw within the Library's draw budget, and the sheet still the only actor.

**Built: the state and the filter; not built: the door.** At 342 × 740 a Library song row that is a project wears one plain badge in the sheet's words (*Learning*, then *Paused* after the pause), the title width and actions unchanged, the row growing by the badge line within R2's 96 px; a *Project* select beside *Status* (*Project or not* · *Your projects* · the eight states) reads in `matches` the way `status` does, with the index passed in so `matches` never opens the store; one store read per load or change, one lookup per row; the draw time before and after moved by no visible amount here (alternating builds, three rounds each). The badge is plain, not the Stage 9 page's `passed` style, because that style draws a tick and *✓ Paused* would claim an achievement for a stated intention — and the Stage 9 page itself does draw that tick today (found by this builder; a one-word fix routed to G87's builder, which owns that file).

**The door, tried and set aside under the brief's deviation clause.** A *Project* word beside *Details* and *⋯* took the song title's column from about 164 to about 95 CSS px here; the four *Twinkle* rows lost the words that tell them apart and *Details Project* read as one link. So the row has no door and no `onChange`; the browser case pauses through Progress's sheet instead. **Question 1:** where should the Library's door go — the Details sheet (the builder's recommendation: no row width, one more tap, the finish sheet's words), a boxed glyph, a row in the *⋯* sheet, or the badge itself? **Question 2:** should the Stage 9 rows open the sheet (item 6's *possibly*)? They have ▶ and *Know it* and no door, and their titles are already cut at 342 px. **Question 3:** the two new filter words, *Project or not* and *Your projects*, are unverified as copy (*Any project* was avoided because *Any status* beside it means no filter).

**Premises corrected at the code.** The Library's header says 570 rows at about 15 ms in total, not each; the status filter is a select, not chips; `library.spec.ts` uses 360 × 780 (342 × 740 is `projects.spec.ts`'s); `isProjectable` counts a PDF import as projectable though nothing can make a project on one.

**Not run as the map writes it.** The lane config matches no map pattern, so the map asked for the full suites; the whole browser suite was not run (the map's eleven specs for the code ran, 113 passed, after the lane's storage-state origin was moved to its port). Two whole unit-suite runs failed only on the recorded pair and load (files pass alone; five crashed workers rerun green). CI has not run this tree.

## Files to inspect

`docs/prompts/entry-147.md` (the pictures under `pictures/g85/`); `app/src/ui/screens/LibraryScreen.ts` at the badge, the row action and the filter; `app/tests/unit/projectLifecycle.test.ts` at the readers list; `app/tests/e2e/library.spec.ts` at the G85 case; the unit test named in the entry.

## Not done, with the reason

See the entry's Not done lines.

## Do not re-review

G1b, G1c as accepted; G1d's approved parts; every closed seam.
