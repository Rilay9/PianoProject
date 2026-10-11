# FABLE.md: what this project is and how work runs (branch `claude/piano-loop`, started 2026-10-11)

**Read this first, every session.** The owner's newest word wins. When it changes the plan, edit this file the same day and save the owner's words verbatim under `docs/inputs/`. Only the owner's actual words are attributed to the owner.

This branch started empty on 2026-10-11 (the owner: "New one empty with files ported as needed"). Files come over from the older branches only when a job needs them, and the reason is recorded in the commit.

## 1. The objective

The owner's words of 2026-10-11 are saved whole in `docs/inputs/2026-10-11.md`. In short:

1. **For the owner:** learn piano week by week. The owner says what to work on; Claude makes it, checks it and pushes it; the owner plays it in the app; the app records how it went and what the owner thought of each item; Claude reads that, advises, and makes the next thing.
2. **For people who follow:** the path the owner actually took, with the items the owner kept, becomes a curriculum that can be passed on. It may be messy at first and cleaned up later, but every item in it is correct.

The owner's goals are dynamic. There is no fixed curriculum or rung order: "We'll build the rungs as we go" (the owner, 2026-10-11). Each step the owner actually takes becomes a rung, recorded with its kept items.

## 2. The app: a finished engine, fed with content

- **The engine** is built once and made excellent: score display, playback, MIDI input and on-screen keyboard, practice modes (hands separately, slow, loop bars, wait for the right note), the accompaniment lab, Simon and the old app's other features, stats per attempt, the PDMX import, offline use as a PWA installed from Pages. Most of it exists on the old branch and is ported with tweaks; the owner's ChatGPT helps with the tweaks.
- **Feedback and export are features of every part of the app** (the owner, 2026-10-11): on every song, excerpt, generated exercise, drill and anything else shown, the owner can mark it good or bad with a note; one export file carries the marks and the play stats.
- **Content is data the engine reads and acts on:** exercises, drills, excerpts, pieces, lesson text, video links, animations, feature presets (an accompaniment-lab setup, a Simon sequence). The engine never hard-codes teaching content.
- **The content contract** (the format the engine reads, the export format, and a validator) is the hinge between the two and is written before content work starts.

## 3. The weekly loop

1. The owner names the week's focus: a skill, a style, a piece, or "next".
2. Claude makes it: generated exercises written as MusicXML and checked by code before use; pieces and excerpts found through the facts index; short explanations.
3. Claude validates it against the content contract and pushes it.
4. The owner plays it, marks each item, and exports.
5. Claude reads the export (a script summarises it), advises, records which items are kept or dropped and why, and adds the step to the path.

## 4. Rules

- **Never teach anything wrong.** Generated material passes the code check; scores are real files; explanations are accurate general instruction; interpretation of a particular piece (character, "the theme returns") goes in only when the owner accepts it.
- **Correct, not tidy.** Order and organisation can be messy and are cleaned up later; correctness cannot wait.
- **Reference, not authority.** `curriculum.md`, `rungs.md`, the piece lists and the score tools on `claude/piano-rebuild`, and published method books and syllabuses, are sources Claude draws on when making content. None of them decides what comes next; the owner does.
- **Where things live.** Public repo: app code, generated content, the facts index, the path record. The owner's phone only: the PDMX scores (imported into the app, never pushed) and the stats. No score file is ever pushed.
- **Shareable from the start.** Every kept item records its source and licence; the owner's personal-use freedom does not cover passing pieces on.
- **The installed app is not broken by work in progress.** Until the new app is ready it deploys to a separate path (for example `/PianoProject/next/`); the owner switches when ready.
- **Cheap to run.** Scripts do the heavy work so a weekly session fits a small plan. Agents only where they are the cheapest capable way; never Fable agents.

## 5. How work runs

- The owner decides; nothing starts without the owner's say-so. The owner's ChatGPT reviews and helps tweak the app.
- Claude commits named paths only and pushes on the owner's go; agents never commit or push.
- One job at a time, named below with its finish condition.

## 6. Current job and next jobs

1. **Content contract** (now): the content format, the export format and a validator, with the Alberti exercise (`alberti-handwritten.musicxml`, made 2026-10-11) as the first item. Finish: the validator accepts it and rejects broken examples.
2. **Port the engine** from the old app feature by feature onto this branch, reading content only through the contract; feedback and export on every item; the PDMX import; deploy to the separate path.
3. **Loop tools:** exercise generators, the MusicXML check, the export summariser, the excerpt lookup.
4. **Week 1.**

## 7. Branches

| Branch | What it holds |
| --- | --- |
| `claude/piano-loop` | This project. Governs. |
| `claude/piano-rebuild` (last a2f29e26) | Reference: curriculum.md, rungs.md, the chosen pieces, the score characteristic rows (E01-E47, D01, D02) and tools. |
| `claude/piano-teaching-app-bo19td` (c8b33af6) | The old app, whole: the engine features to port. |
