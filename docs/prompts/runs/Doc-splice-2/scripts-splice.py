"""Doc-splice-2: every doc row since the last splice, spliced once into the spec it names.

Run from the worktree root:  python docs/prompts/runs/Doc-splice-2/scripts-splice.py [--dry]

Each operation is one row (or one part of a row) as it was verified against the code at HEAD
(`scripts-verify_rows.py`), in the combined, superseding form the table in ENTRY.md explains.

- Idempotent: an operation whose key phrase is already in its file is skipped ("already present").
- Every anchor must occur exactly once; otherwise the operation is refused and nothing is written.
- The docs are CRLF in this worktree: read as text with LF, written back with CRLF.
- Prints, per operation, its result and the lines its text occupies in the file as written.
"""
from __future__ import annotations

import pathlib
import sys
import textwrap

ROOT = pathlib.Path(__file__).resolve().parents[4]


def w(text: str, width: int = 96, indent: str = '', first: str | None = None, lead: int = 0) -> str:
    """One paragraph wrapped to the file's width, words never broken. `lead`: the characters already on
    the line where the text starts mid-line, so its first line ends near where the others do."""
    out = textwrap.fill(
        ' '.join(text.split()), width=width,
        initial_indent=(' ' * lead) if lead else (indent if first is None else first),
        subsequent_indent=indent, break_long_words=False, break_on_hyphens=False,
    )
    return out.lstrip(' ') if lead else out


D01, D02, D03, D04, D05, D08 = (
    'docs/01-architecture.md', 'docs/02-curriculum.md', 'docs/03-content-pipeline.md',
    'docs/04-ui-spec.md', 'docs/05-score-follow-engine.md', 'docs/08-test-map.md',
)

OPS: list[dict] = []


def op(kind: str, file: str, row: str, key: str, anchor: str, text: str) -> None:
    OPS.append({'kind': kind, 'file': file, 'row': row, 'key': key, 'anchor': anchor, 'text': text})


# ============================== docs/01 =========================================================

op('replace', D01, '119-i (G1a)', 'the field a consumer of general contact reads, and `unseen` is the',
   """Since G1
  `unseen` is written on every Score-screen run as the first-contact fact, and the readers that
  gave it sight-reading's consequences (`recordRun`, the rung state, the history line, the
  evidence job) read it on a phrase's run only (`db.isPhraseRun`).""",
   w("""Since G1a the Score screen writes the first-contact relation on every run as
  `RunHeader.firstContact`, the field a consumer of general contact reads, and `unseen` is the
  generated phrase's sight-reading condition again, written on phrase runs only beside it (equal
  today). The readers that give `unseen` sight-reading's consequences (`recordRun`, the rung state,
  the history line, the evidence job) read it through `db.isPhraseRun`, which the rows G1's app
  stored — `unseen` on a piece's run, no `firstContact` — still need. G1a spends no `DB_VERSION`:
  both fields are optional and nothing is rewritten.""", 98, '  ', '', lead=89))

op('after_line', D01, '138-e (G1b)', '| `projects` |', '| `contacts` | material key |',
   "| `projects` | id | one row per piece of the learner's stated intention (G1b, version 9): `ProjectRow` — the material or the id, the state and since, the append-only history, goal, problem, sections — written only by the project sheet; indexed `byItem`; in the backup (a merge joins histories), cleared by *Reset progress*. |")

# ============================== docs/02 =========================================================

op('replace', D02, '112-a (G1) with 119-j (G1a)', 'A visit is one opening of the Score screen',
   """phrase first means the day is not ticked by it. *A performance the piece was played to the
  learner in the middle of*""",
   w("""phrase first means the day is not ticked by it. A phrase heard on any visit since G1 is not a
  first reading either — a playback is a stored encounter (`encounterStore`), read back when the
  phrase is opened again — and neither is a phrase looked at on another visit; looking at it on
  this visit, before playing, is what sight-reading is. A visit is one opening of the Score screen:
  a reload, Back and a return, a second tab are each another. A notated piece, an excerpt or an
  import carries the first-contact relation on its run (`firstContact`, over the bars the run
  covered; since G1a, never `unseen`) as an audit fact that refuses it nothing: a piece played
  again passes and meets its rung as before (the first-reading rules read `unseen`, a phrase's
  field; G1, G1a).""", 95, '  ', '') + """ *A performance the piece was played to the
  learner in the middle of*""")

op('after', D02, '112-b (G1) with G2', 'contact reads the encounters that are not runs',
   """>   where neither exists, with the id's contact beside it (a new seed or version is new material).""",
   '\n' + w("""Since G1 (`progressStore.contact`) contact reads the encounters that are not runs and the
  summaries of runs the retention cap deleted as well: material viewed, heard or demonstrated and
  never played is *met*, a pruned run's material is still *met*, and a *met* says how (`how`:
  `played`, `heard`, `demonstrated`, `viewed`). Since G2 the session's offer reads the same contact
  (`session.contactOf` over `BuildInput.contact`, which Today loads), so a piece heard once or
  practised and pruned is never offered as new (G1, G2).""", 98, '>   '))

op('after', D02, '134-l (X1)', "How to practise's row comes after the learner's own rung's new material",
   """plateaus and injury covered once in lesson 0.3 and nowhere after.""",
   '\n\n' + w("""On Today, How to practise's row comes after the learner's own rung's new material, never in its
  place (X1, a stated teaching policy, `session.METHOD_TRACKS`): the track is how to practise beside
  the core, not instead of it.""", 80))

# ============================== docs/03 =========================================================

op('replace', D03, 'Q77', 'the one check found, `test_pdmx.py`',
   """They differ in four fields —
`file`, `importHint`, `tags` and `source.checksum` — and in nothing else, which is checked.""",
   w("""They differ in the rows the strict build does not bundle — each a placeholder, with no `file` and
  an `importHint` — and in what a missing file makes of those rows: `demands` and `measurement`
  unmeasured (*no notation is bundled*), the provenance's demands fact saying so, and no excerpt cut
  from such a parent (the public build's placeholders, below). (Q77, Doc-splice-2: this said they
  differ "in four fields — `file`, `importHint`, `tags` and `source.checksum` — and in nothing else,
  which is checked"; since E0 a bundled score is measured and a placeholder is not, and the one check
  found, `test_pdmx.py`, holds a PDMX placeholder's file, hint and tag, not that nothing else
  differs.)""", 95, '', '', lead=62))

# ============================== docs/04 =========================================================

op('after', D04, '135-b (U90)', 'And **Skills** (U90, 2026-09-29)',
   """upright left the words about a third of the row, `No. 12 — Stud…` over
`page 14 · for Right h`.""",
   '\n' + w("""And **Skills** (U90, 2026-09-29): a skill's name and an exercise's title wrap rather than
  being cut, whatever the font (§3a).""", 88))

op('replace', D04, '134-g (X1)', 'chord-and-feel material first (a score with chord symbols',
   """- **Jam** is an option of a rung on a jam track (chords & pop, blues, jazz, jam) the learner
  has reached, played least lately;""",
   """- **Jam** is an option of a rung on a jam track (chords & pop, blues, jazz, jam) the learner
  has reached, chord-and-feel material first (a score with chord symbols, a backing-track groove;
  G61, X1), played least lately;""")

op('after', D04, '134-h (X1)', 'This offer could not be kept on this phone',
   """composing the card again, or swapping the offer's row away, supersedes it.""",
   " It opens only once it is kept: a write that fails opens nothing, and Today says *This offer could not be kept on this phone, so it was not opened. Try again.* (U73, X1).")

op('after', D04, '134-d (X1)', '| jam, the option not chord-and-feel material',
   """| jam | Chords, form and feel: from Playing from chord symbols |""",
   """\n| jam, the option not chord-and-feel material (the rung has none, or Shuffle reached past them) | From Playing from chord symbols |""")

op('replace', D04, '134-e (X1)', 'the card: *Shifting position: something new*',
   """| the transfer offer (D4) | Shifting position: something new, for a skill you have shown — it should feel different |""",
   """| the transfer offer (D4) | the card: *Shifting position: something new*; the whole line (*… something new, for a skill you have shown — it should feel different*) on the session's transition (U71) |""")

op('replace', D04, '134-f (X1)', '`somethingNewHead` "something new"',
   """`feelDifferent` "it should feel different".""",
   """`feelDifferent` "it should feel different", `somethingNewHead` "something new" (the card's head;
U71, X1).""")

op('replace', D04, '134-a/b/c (X1)', '**"Start session" runs today\'s session**',
   """- "Start session" runs the rows in order with a between-item summary.""",
   '\n'.join([
       w("""**"Start session" runs today's session** (X1, 2026-09-29; Part 18; `data/sessionRun.ts`,
  `ui/sessionRunner.ts`). It writes one record of the card as composed at that moment — swaps
  included — under one `settings` key (`pianopath.sessionRun`): each activity's slot, the route that
  opens it, the composition's own words, its contact assumption and what becomes of it. The free
  prompt and anything whose screen owns no honest finish (a PDF, a placeholder, the guided tour)
  stay outside the cursor. It then opens the first activity with its token (`?session=`). While a
  session is open today the card is the session's, never a card composed since: done rows say
  *done*, a row tried and moved on from *played*, a skipped one *skipped*, and the current one
  *next*, with a blue edge. The one filled box is **Continue**, under *Continue today's session · N
  of M min · next: …* (visible time on the activities' screens, never wall time), beside a quiet
  *End today's session*. A row tapped out of order becomes current; a running row's *Swap* replaces
  that activity with a new token. A length chip or *Shuffle* recomposes the card and closes the
  running session. An early end says what waits — *Today's session ended · N min*, *… — left for
  another day: Review, New* — and marks nothing failed. After the last activity the finish line
  says *Today's session done · N min* over what each came to (*Warm-up done · Review played · …*),
  above *Start session*, and a card composed after it marks rows *done today*. Another day's open
  session is closed as not finished, without a word. Nothing about a session is evidence.""", 96, '  ', '- '),
       w("""**An automatic row from a rung's own list asks the one gate** (L113, X1;
  `eligibility.automaticFromList`): an unmeasured option, or a learner's assignment of an import
  the app has not measured, or a PDF, is on no row; a measured option keeps its placement. The
  Library still lists and opens every one, the missing measurement said.""", 96, '  ', '- '),
       w("""**The practice row's place** (X1, a stated teaching policy): the new piece is the learner's own
  rung's new material first, and How to practise's row second (the next slot that takes a strand's
  own option). At 1.2 on the 30-minute card, New is 1.2's song and the practice row is
  `practice.1`'s song in the repertoire slot.""", 96, '  ', '- '),
   ]))

op('replace', D04, '139-a (G1c)', 'none on Stage 9, a project stage, whose line says what it is',
   """- Stage list (0–9) with completion rings; expand → units → lessons.""",
   """- Stage list (0–9) with completion rings — none on Stage 9, a project stage, whose line says
  what it is (§3f) — expand → units → lessons.""")

op('after', D04, '134-k (X1)', 'This lesson has no drill that measures a run yet',
   """are all grooves (their asks stay unmet, §2). No ladder rung changes.""",
   '\n' + w("""*Quick check* takes the first option whose run is measured — notation, or a drill of a kind
  that judges (`DrillScreen.measuresARun`, the list `drillOutcome` reads) — and where a lesson has
  only unmeasured drills it says *This lesson has no drill that measures a run yet* (G62, X1).""", 96, '  '))

op('after', D04, '139-b (G1c)', '**A project stage on Plan (G1c; G83, L86).**',
   """never the measured fill. A legend over the stage list names the two fills (*done before* ·
*counted since*), and is drawn only where something was carried.""",
   '\n\n' + w("""**A project stage on Plan (G1c; G83, L86).** Stage 9 says "Nothing here is a rung to pass",
  and its page says so (*A project: there is no rung to pass here.*, below). Plan reads the same
  constant (`projectStore.PROJECT_STAGES`): a project stage's line is that sentence
  (`PROJECT_TEXT.stageNine`) — no *x of y*, no *by your word*, no *done before* — with no bar under
  it and no *complete*; its rows wear no rung badge, no learner's word and no carry-over. A unit
  there lists several pieces, so its row wears none of their project states either; the page it
  opens shows each piece's. The rungs keep their state in the evidence (`rungState.ts`,
  unchanged); Plan stops presenting it. The legend names the bar's two fills only where a stage
  that draws a bar carried rungs."""))

op('after', D04, '138-a (G1b)', "**A project stage's page (G1b; L86).**",
   """*Open that lesson*, not *Go to 1.1*. A prerequisite is satisfied when it is met, set aside by
the learner's word, or carried over.""",
   '\n\n' + w("""**A project stage's page (G1b; L86).** Stage 9 says "Nothing here is a rung to pass", so a
  unit whose stage is a project stage (`projectStore.PROJECT_STAGES`) draws no *What the app
  counts*, no state badge, no *I already know this* and no *Mark done*: under *Quick check* one
  line, *A project: there is no rung to pass here.*, and each song option a badge of the learner's
  project state (`PROJECT_TEXT.states`) or *not started*. The unit's `requirements` stay in the
  data and the rung state reads them as before (`rungState.ts`, unchanged; the session never
  advances into the stage); this page stops presenting them. Changing one project changes that row
  alone."""))

op('after', D04, '135-a (U90)', '**A name is never cut (U90, 2026-09-29).**',
   """*Drill it* is the box; *Find more* is text (R3).""",
   '\n\n' + w("""**A name is never cut (U90, 2026-09-29).** A skill's name, and an exercise's title under
  it, wraps to the lines it needs beside *Drill it* and *Find more* and never ends in an ellipsis.
  The row grows with the name, and the actions keep their place, because the words keep their 5rem
  basis. One line with an ellipsis cut "Leaps: a fourth or fifth" on CI's runner, and here under
  a face wider than Segoe UI (Verdana) and at 115 % text. On Segoe UI itself it cut "Finger
  numbers" to "Finger num…", and both coordination exercises in A to "Hands together in A — left
  ha…". This is Skills' exception to R2's one title line. A long name beside both buttons takes
  three or four short lines, and such a row can stand past 96 px."""))

op('replace', D04, '132-c (G2a)', 'never another cut of a piece already played (G2, G2a)',
   """*shown on different
material* (the ladder's *transfer demonstrated*, said as what v0 measured — a different item —
and never "transferred", Part 26)""",
   """*shown on different
material* (the ladder's *transfer demonstrated*: a first reading at the full standard that the
transfer policy reads as measurably different on one of the skill's own dimensions — never a new
seed of what established it, never another cut of a piece already played (G2, G2a) — and never
"transferred", Part 26)""")

op('after', D04, '132-d (G2a)', "No screen shows the transfer policy's reading of a run",
   """| heading / nothingMoved / review / shownAgain | Skills · No skill the app measures has moved in the last four weeks. · Review a skill · shown again |""",
   '\n\n' + w("""No screen shows the transfer policy's reading of a run (its `why` is for a reader of the
  record): the Skills screen and Progress show the ladder state's words alone, and those words did
  not change with G2 or G2a."""))

op('after', D04, '118-e (X3)', "An import's detail line names where its notes came from",
   """delete. A bad file fails with one sentence from the parser, not a stack trace (§9).""",
   """
  An import's detail line names where its notes came from (*read from the file*, *converted from
  MIDI*) in place of the type every import shares, and a state line under it says whose the hands
  are, whether it is measured, and whether the tempo is the app's guess (X3).""")

op('after', D04, '137-b (X3e)', 'A MusicXML file in the timewise form is kept as its partwise twin',
   """are, whether it is measured, and whether the tempo is the app's guess (X3).""",
   '\n' + w("""A MusicXML file in the timewise form is kept as its partwise twin (X3e): its sheet, its
  measurement, its swap, a stated tempo and the Score screen read it as the same file written
  partwise.""", 96, '  '))

op('after', D04, '118-f (X3)', "A placeholder's detail sheet",
   """- Item detail sheet: metadata, sections, practice tips, media, "Open".""",
   '\n' + w("""A placeholder's detail sheet (a piece the catalogue wants and does not bundle) has no *Tracks*
  and no *What it trains*: the piece's `importHint`, what the app reads, and *Import a score*; any
  detail sheet names a track by its title and leaves out an id with none (U75; X3).""", 96, '  '))

op('replace', D04, '118-a (X3)', 'the **import sheet** opens by',
   """an Android share, or **Import for this rung** on a lesson page — a sheet opens by itself
  asking where the piece goes:""",
   """an Android share, or **Import for this rung** on a lesson page — the **import sheet** opens by
  itself (below), which ends in the assign sheet's body asking where the piece goes:""")

op('replace', D04, '118-b (X3)', '**Wherever the app guessed is the exception**',
   """  - **A file that arrived as MIDI is the exception, wherever it was imported from** (T29).""",
   """  - **Wherever the app guessed is the exception** (T29; X3): a file that arrived as MIDI from any
    door, or a score whose stored provenance says its hands or key were inferred (the command-line
    converter's MusicXML).""")

op('after', D04, '118-c (X3)', 'Its hands sentence is derived from the row at',
   """The note lives in memory for the visit, not on the row:
    it is a fact about this moment, not about the score.""",
   """ Its hands sentence is derived from the row at
    render (U72): once the learner has corrected the hands it says they are the learner's (X3).""")

op('after', D04, '118-d (X3), 128-a (X3a, X3b), 129-a (X3c, X3d)', '**The import sheet** (X3, 2026-09-29)',
   """    printed the rung's id.) It is in the backup.""",
   '\n' + '\n'.join([
       w("""**The import sheet** (X3, 2026-09-29). Opened by the UI that received the stored row — the
  picker and drop target, the share path, *Import for this rung*, the row's *Assign* — never by the
  store. The sheet's heading is the title. *What the app read*: composer, length in bars, key
  signature as printed (the key named only where the file states its mode), and this visit's
  self-check. *What the app guessed*: hands, tempo, and the key where estimated, each with whose it
  is (the app's guess, from the file, yours) as the store holds it. **Swap the hands** exchanges the
  two staves' notes, keeps each staff's clef, and saves through `correctImportHands`, which
  measures the corrected score again. The tempo line and its control are the next two bullets
  (X3a–X3d); there is no key control (E49). *What the notes ask* is E2's line. *Where does it
  belong?* is the assign sheet's body (above), T52's sentence first. Nothing on it is evidence;
  the piece is played by opening it.""", 96, '  ', '- '),
       w("""**Use this tempo** (X3a, X3b): on the tempo line of every MusicXML import — the app's guess,
  the file's, or one the learner already stated — "♩ =" and a number, and *Use this tempo*, which
  saves through `importStore.stateImportTempo` (E48): the score opens at the stated tempo and is
  measured again, the tempo fact names the learner, and an estimated level is estimated again. The
  line then says "You stated ♩ = N" (*yours*), N read from the tempo the stored score opens at, and
  the Library row's state says *tempo yours*. The control stays after a statement, its number
  starting again at the tempo the score now opens at, so a slip is put right on the sheet and every
  later statement goes through the same store operation. A tempo outside 20–400 is refused in the
  store's words and never clamped by the sheet; the field keeps what was typed. No control on a
  PDF; the tempo and the hands are changed one at a time.""", 96, '  ', '- '),
       w("""**The tempo line** (X3c, X3d): one number, the tempo the score opens at in quarter notes a
  minute, read by the Score screen's own reader (`tempoFromXml`, X3d), so the number the line
  names is the number the Score screen opens at — for the learner's line ("You stated ♩ = N"), the
  file's and the number *Use this tempo* starts at. The file's line adds the printed mark at the
  opening in its own note where it counts another note ("The file says 𝅗𝅥 = 60 (120 quarter notes a
  minute)."), and a mark with no `<sound tempo>` is said with the quarter notes it means in the
  same words, the field at that number (X3d); a quarter-note mark that agrees says one number ("The
  file says ♩ = 96."); a mark and a playback tempo that disagree are said apart, never as a
  conversion ("The file prints 𝅗𝅥 = 60; its playback tempo is 100 quarter notes a minute."); a mark
  the door read from the file's text (E32) is said as printed and as read ("The file’s mark says “=
  60”, with no note; the app reads it as a half note, the metre’s beat: 120 quarter notes a
  minute."); a tempo written only after the opening is never said as the opening ("The file writes
  no tempo at its opening, only later in the piece."). The line says what the file states, which
  since X3d is what the Score screen plays. **Fractional tempos:** kept as the file wrote them (the
  sheet writes nothing); said as the score carries them to three places (72.5), or "about" the
  whole beat where the file carries more (90.00009000009 → "about 90"); the field starts at the
  number the line names, so a press keeps a three-place tempo and states the whole beat for a finer
  one — the learner's act. A learner's statement is stored to three places and said as
  stored.""", 96, '  ', '- '),
   ]))

op('after', D04, '125-a (U80)', '**On a tablet the first draw waits for the side panel (U80',
   """change (a height alone off a run; a width always, releasing and retaking a run's size), as it
did.""",
   '\n\n' + w("""**On a tablet the first draw waits for the side panel (U80, 2026-09-29).** The lesson panel's
  320 px column is part of the stage's width, so the Score screen hands the renderer its stage only
  once the panel is decided: filled (`data-side="text"`) or left out (`data-side="empty"`: a piece
  on no rung, a lesson that will not read). `data-side` is absent until then and set once per
  opening; a phone has no panel and is `empty` from the start. The panel's two reads (the
  curriculum and the lesson file, both precached) start when the item is found, beside the score's
  own, and the first draw waits for them no longer than `SIDE_PANEL_WAIT_MS` past the score being
  ready; past it the score draws with the column's track kept, so a panel that then arrives with
  text moves nothing and one left out gives the width back as a resize. Before, the panel arrived
  after the first draw on every piece `side-panel-prose.spec.ts` sweeps, at every tablet size
  measured, and where the column takes width from the stage the music was drawn across the whole
  width and then refitted narrower beside it."""))

op('after', D04, '133-d (X3d)', "The bpm is the score model's tempo at the cursor",
   """These are the things that change during a practice; one row in every form factor, on a phone
either way up and on a tablet.""",
   '\n' + w("""The bpm is the score model's tempo at the cursor, in quarter notes a minute from the file's own
  tempo (X3d): a half note = 60 with its `<sound tempo="120">` says 120 bpm at 100 %, *Row, Row, Row
  Your Boat* (dotted quarter = 54) 81; the count-in clicks at the same number."""))

op('after', D04, '127-a (U82)', "Since U74 that count is priced from the piece's measurement",
   """said a bar's room, and the row said *1 shown* while two bars and the start of the third were
on the glass).""",
   '\n' + w("""Since U74 that count is priced from the piece's measurement from the first draw. Before, the
  window said the count asked until the measurement landed on idle, after the first paint, over the
  same picture — on the dev piece `tempo-change` at 880 × 412 "two shown" with the second bar past
  the right edge — and `score.slide.spec`'s sideways case asserted that word; it asserts the rule
  on the glass now (U82, 2026-09-29)."""))

op('after', D04, '138-b (G1b)', '**What next with this piece? (G1b).**',
   """  The side panel's prose is that same rung's, and the first rung listing the piece where
  nothing names one.""",
   '\n\n' + w("""**What next with this piece? (G1b).** On a song's summary, before *Done*, an outlined *What
  next with this piece?* opens the project sheet over it (never on a generated phrase or a drill).
  The sheet: the piece's title; its state and since (*Learning since 2026-09-29*) or *Not a project
  yet*; the history's last line (*You performed it on …*, else *Before this: Put away, from …*);
  what the encounter history says (*You last played it on …*, *…part of it…*, *You have listened
  to it and not played it yet.*, *You have opened it and not played it yet.*, *You have never
  opened it.*); the choices the state offers, as quiet text (*Save for later · Learn this ·
  Prepare it for performance · It is ready · I performed it* with a date · *Keep it playable ·
  Bring it back · Pause · Put it away*, the table in Entry 138); and once there is a project,
  *This week's goal*, *The problem right now* and *Sections* (*Bars [ ] to [ ]*, *Name*, *Add
  section*; *Bars run from 1 to N.* where a section falls outside the piece). Opening it writes
  nothing; every change is the learner's choice; messages sit inside the sheet (R6); leaving the
  screen that opened it closes it. The words are `help.ts`'s `PROJECT_TEXT`.""", 96, '  '))

op('replace', D04, '119-a (G1a)', "a run's first contact (`firstContact`, G1a) is the relation",
   """a run's `unseen` is first contact — no run of it, no playback of it on
  any visit, no viewing of it on another visit (looking at it on this visit, before playing, is
  what reading it needs) — read again before the run is stored, in case another tab met it
  meanwhile. A sight-read refused for a viewing alone says *Sight-reading counts only on music
  you have not seen before — this run is kept as practice.* A piece, an excerpt and an import
  carry the fact too, over the bars the run covered, as an audit fact that refuses them nothing;""",
   w("""a run's first contact (`firstContact`, G1a) is the relation — no run of it, no playback of it
  on any visit, no viewing of it on another visit (looking at it on this visit, before playing, is
  what reading it needs) — read again before the run is stored, in case another tab met it
  meanwhile. A sight-read's run carries sight-reading's condition beside it (`unseen`, the
  generated phrase's field since C1), derived from that relation and the visit rule and equal to
  it today; `unseen: false` is what keeps a phrase met before from passing (§2, §6). A sight-read
  refused for a viewing alone says *Sight-reading counts only on music you have not seen before —
  this run is kept as practice.* A piece, an excerpt and an import carry the relation alone
  (`firstContact` over the bars the run covered, no `unseen`), an audit fact that refuses them
  nothing;""", 96, '  ', '', lead=29))

op('after', D04, '119-b (G1a)', "Runs G1's app stored between its landing and G1a's",
   """  an import is its stored bytes (their sha256), so a duplicate under a new id is the same
  material. The Library's text row is not a viewing.""",
   '\n' + w("""Runs G1's app stored between its landing and G1a's carry the fact as `unseen` on a piece's run
  too, and no `firstContact`: they read as they did (`db.isPhraseRun`), and their relation is
  unknown, never inferred. A consumer of general contact never reads `unseen` for it: the transfer
  policy reads the attempt's `firstContact` (G2), the session and the project sheet the encounter
  history (`session.contactOf`, `encounterStore.familiarity`; X1, G1b) (G1a; the reviewer's
  required change on G1, `responses/b48342f.md`).""", 96, '  '))

op('after', D04, '134-i (X1)', "**In today's session** (X1)",
   """run* in place of a bar: the sheet stays the record of the run that produced it (§7's own
  case in the state-machine document), and *Again* then runs with what the line says.""",
   '\n\n' + w("""**In today's session** (X1): where the run is a session's activity (`?session=`), the
  sheet's closing action is the next step. The heading stands first; directly under it is one
  bordered block with *Next: {title}, N min — {the composition's own words}*, *N of M min so far*,
  a filled **Start** (the next activity opened straight away, never through Today) and **Skip or
  change** (the next skipped by the learner, back to Today). After a measured failure the block
  says *Still unstable, so we're not moving on* with *Try again* and *Move on anyway*. After easy
  first-attempt success it says *Easier than expected — {the skipped practice} is skipped*. A first
  contact met since the card was composed says *You heard this one earlier today, so it is
  practice now, not a first read* (*played* or *saw* where that is how it was met). After the last
  activity it says *That was the last one — today's session is done* and **Done**. *Done* gives way
  to the block. The Score screen reports opened, attempted and completed (the stored run's measured
  outcome, never a self-report) and its visible time, and reads nothing else of the session.""", 96, '  '))

op('after', D04, '134-j (X1)', "In today's session the end sheet's closing action is the same transition",
   """  pass is a chain rather than a share of the cards (`engine/drills/simon.ts`).""",
   '\n' + w("""In today's session the end sheet's closing action is the same transition (X1); *Back to the
  plan* gives way to it and *Again* is outlined. A set that ran out completes the activity with its
  judged result, or none where the drill judges nothing. A stopped set completes nothing, and
  *Start* moves on.""", 96, '  '))

op('after', D04, '138-c (G1b)', '**Projects (G1b).** What the learner says',
   """  to the Skills screen. Never a stage number: the strands move separately (L85).""",
   '\n' + w("""**Projects (G1b).** What the learner says they are doing with each piece, newest change
  first: the title, *State since day* on the second line, *Goal: …* on the third where one is typed;
  a row opens the project sheet (§5). Under them, *Pieces you have passed, not yet projects* — songs
  passed or mastered with no project, *Last played day*, and a quiet *Make it a project* that opens
  the same sheet and makes nothing until a choice there; capped at 20 with *Show N more*. With no
  project, *No projects yet. At the end of a run, "What next with this piece?" makes one.*, and
  with no passed song either, *Pick a piece*. A pass is never made a project by the app.""", 96, '  ', '- '))

op('replace', D04, '119-c (G1a)', "*Not first sight* is a phrase's alone (G1, G1a)",
   """  *Not first sight* is a phrase's alone (G1): since G1 every run the Score screen records carries
  the first-contact fact, and a piece played again (`unseen: false`) says nothing of it — every
  repeat of a piece is not news.""",
   w("""*Not first sight* is a phrase's alone (G1, G1a): the line reads sight-reading's `unseen`, which
  only a phrase's run carries; a piece's run carries the relation as `firstContact`, which the line
  does not print — every repeat of a piece is not news — and a piece's run G1's app stored with
  `unseen: false` says nothing either.""", 96, '  '))

op('after', D04, '125-b (U80)', "Since U80 the Score screen's first draw on a tablet waits",
   """default of 4 and a collapsible side panel on the Score screen carrying the lesson text of the
rung the piece belongs to.""",
   '\n' + w("""Since U80 the Score screen's first draw on a tablet waits for the panel's decision (§5), so
  the notation is never drawn at the width it has without the panel and then narrowed when the
  panel arrives."""))

# ============================== docs/05 =========================================================

op('after', D05, '133-a (X3d) with 137-a (X3e)', "**The tempo map is the file's** (X3d, Entry 133; X3e, Entry 137)",
   """5. **Timing:** `tStep[k] = model.beatToMs(step.onset, tempoPct/100)`; `durStep[k] = tStep[k+1]-tStep[k]`.""",
   '\n\n' + w("""**The tempo map is the file's** (X3d, Entry 133; X3e, Entry 137). `model.tempoMap` is placed
  from `score/tempoFromXml.ts`, the one tempo reader, never from OSMD's iterator: each `<metronome>`
  normalised to quarter notes a minute (per-minute × the beat unit's length in quarters; one dot ×
  1.5, two × 1.75; a metric modulation, the metronome-note form and a mark with no number are not
  tempos) and each `<sound tempo>` — a direction's or one standing in the bar — as written,
  fractions kept; at one position a `<sound tempo>` wins over a mark, being what the file says it
  plays. **The reader walks the partwise nesting only, and every score the app holds is partwise:
  the import door keeps a `<score-timewise>` file as its partwise twin (`score/toPartwise.ts`, X3e)
  before anything reads it, because OSMD 2.1.2 loads nothing else, and no bundled score is
  timewise (Entry 137's search); so a timewise file's opening mark, `<sound tempo>` and later
  changes give the map, the label, the count-in and the import sheet its partwise twin gives.**
  Each event stands at its measure's start on the unrolled timeline plus its offset, placed every
  time the walk enters the measure, a bar repeated on its own included. The piece opens at the
  event at the first measure's start, or at the file's first tempo where nothing sounds before it
  (a tempo hung on the first note after opening rests); otherwise at `DEFAULT_BPM` (or
  `defaultBpm`) until the first event, which is a change where it stands. `extractScoreModel`
  requires the MusicXML it was loaded from (`musicXml`); `OsmdView.extractModel` passes the text
  it loaded. Every consumer reads the map: the Score screen's label and bpm field (`bpmAt` at the
  cursor, times the percentage), the timetable and the count-in (`beatToMs` from the run's first
  step), the evidence windows (`msPerQuarterAt`), the import estimate (`difficulty.ts`, the first
  entry), the dev screens. Why: OSMD 2.1.2 read a mark's number as quarter notes whatever its note,
  let it replace the `<sound tempo>` beside it, gave tempo words numbers of its own, took a `<sound
  tempo>` standing in a bar only where no other tempo stood, and opened at the first tempo anywhere
  — a half note = 60 in cut time played at 60 for 120, *The Entertainer* at 106 for its 70 (X3c's
  probe; Entry 133's corpus: 179 of 2,011 bundled openings moved, 175 to the content build's own
  reading); and it refuses a timewise document outright, so before X3e a timewise import opened
  nowhere and its sheet said the app chose 100 (Entry 137).""", 100, '   '))

op('after', D05, '138-d (G1b)', '**A project is not evidence (G1b;',
   """well as an interval-reader (the reviewer's principle, `audit-2026-09-25-outside.md` Part 7).""",
   '\n\n' + w("""**A project is not evidence (G1b; the reviewer's ruling on G1b).** The learner's project states
  (`projects`, `docs/01` §4.5) — *I performed it* and its date among them — are learner-stated
  intention: no evidence record, observation, encounter, run or competence result is written by a
  project action, and no evidence, ladder, rung or eligibility reader reads one.
  `projectLifecycle.test.ts` pins it (every other store, the rung state and the skill ladders
  deep-equal across every action).""", 99))

op('replace', D05, '126-a (G2) with 132-a (G2a)', 'the transfer policy reads as `demonstrated`: first contact',
   """transfer demonstrated
(then a first reading of another item)""",
   """transfer demonstrated
""" + w("""(then a supporting full-standard attempt the transfer policy reads as `demonstrated`: first
  contact, on material that measurably differs from what established the skill on one of the
  skill's own dimensions — `transferPolicy.ts`, G2; never another cut of a composition the learner
  has already played (`relationship.composition.playedAs` non-empty), which reads `unknown` before
  the dimensions until the relationship carries the arrangement or section fact that would tell an
  independent context from familiarity with the tune, G2a)""", 100))

op('replace', D05, '126-b (G2) with 132-b (G2a), 126-c (G2)', 'a failed full-standard attempt the transfer policy spares does not',
   """`countsTowardsMovingDown` — **an attempt against on first contact with
material other than where proficiency was shown does not count towards moving down, nor against
mastery** (C3 second pass): a learner proficient at level 2 who reads two level-4 phrases badly at
sight still reads level 2, and the attempts are evidence about the harder material, not transfer.""",
   w("""`countsTowardsMovingDown` — **a failed full-standard attempt the transfer policy spares does not
  count towards moving down, nor against mastery**: first contact, and a dimension of the skill
  measurably different from what established it (never read for another cut of a composition
  already played: such an attempt is `unknown` and counts unless it carries a demand no
  establishing record carried, G2a) or a demand no establishing record carried; an unknown fact
  spares nothing (G2). A learner proficient at level 2 who reads two level-4 phrases badly at sight
  still reads level 2 where the phrases' facts show the harder material. **Each attempt carries its
  own facts** (G2): the evidence context's `firstContact` is the run header's (never `unseen`;
  absent where the header's is), and `recordRun` writes `relationship` (D4's `relationshipOf` over
  the item as played, against what the ladder's replay established before the run; a
  transfer-offer run's own relationship for its skill) and `demands` (every demand the run's records
  located) on every measured record of a run with a material; a recompute keeps them. The ladder
  exposes `established` (the supporting full-standard records before proficiency, since it was last
  lost) and `transferScope` (each demonstrated reading's dimensions and when, never more than the
  summary's `transfer`). A skill's transfer dimensions are the vocabulary's `transfer` block; a
  skill without one is credited no transfer.""", 100, lead=27))

# ============================== docs/08: the pieces table =======================================

op('after_line', D08, '131-a (Q75)', '**The claim rule judges only what a build measured** (Q75',
   '| **A rung claims only what its options establish, or introduces it** (F2;',
   """| **The claim rule judges only what a build measured** (Q75, the Pages deploy failing since F2): `claims.CHECKED`, where an `unmeasured` option is not a checked option; the claim rows, introduced rows and summary count it apart (`unmeasured`), and the report shows it beside the checked count; `validate.concept_claim_findings` warns a claim whose checked options do not establish it as not judged on this build where any option is unmeasured, and fails it only where none is, saying "0 unmeasured on this build"; a deferral whose options the build could not measure is not stale; `rung_claims_warning` states the unmeasured pairs | the Pages deploy's strict build failing because its licence placeholders counted as checked options that establish nothing (2.4's tie, ragtime.8's stride bass); a failure the runner's log could not tell from a wrong claim; a deferral declared stale because a build could not look | `tools/content/tests/test_validate_claims.py` (added: `TestOnlyWhatThisBuildMeasured`, 8; `TestTheReportCountsTheUnmeasuredApart`, 4) | done (Q75, Entry 131); the strict validation read on the runner at the record commit (Pages run 36559774503 on 248c6138, the entry's note) |""")

op('after_line', D08, '136-c (Q76)', "**The public build keeps 2.4's tie and ragtime.8's stride bass** (Q76",
   '| **The claim rule judges only what a build measured** (Q75',
   """| **The public build keeps 2.4's tie and ragtime.8's stride bass** (Q76): `import_mutopia` (the `[MUTO]` step): the fetch of the named files only, checked against their pins; the licence from the `.ly` header through the gate; the MIDI converter's read-back; every note spelled as the edition spells it or the row refused; the key changes from the MIDI; a placeholder with the reason otherwise; provenance `source: mutopia`, naming the edition, the published MIDI by sha256, the `.ly` and the converter. The authored *Cielito Lindo (simple)*: the right hand is the reference edition's melody note for note and tie for tie; the left hand ties nothing. On the strict flavour of the built catalogue (the personal build with every `personal-build`/`nc-personal-build` row unmeasured, checked against a real strict build), 2.4's tie and ragtime.8's stride bass are established by those two options | the phone's build practising neither claim; a rag shipped with both volta endings played in turn; a converter's key-based spelling (D♭ for C♯) on the page; a tie written into a tune to satisfy the claim; a MIDI-derived score called the edition's notation; a fetched file that is not the pinned one shipping | `tools/content/tests/test_import_mutopia.py` (added: source list, licence, conversion, entry, placement; 12), `test_public_tie_option.py` (added: ties are the tune's, header, placement, strict catalogue; 9) | done (Q76, Entry 136); the runner's fetch and the Pages run unverified until read; nothing heard |""")

op('replace', D08, '123-a (F2b) with 130-a (F2c)', 'F2b (Entry 123): `practice.1` stands on 1.1',
   """`ragtime.5` deferred with their per-bar readings; nothing heard |""",
   """`ragtime.5` deferred with their per-bar readings; nothing heard; F2b (Entry 123): `practice.1` stands on 1.1 (the track opens from the second rung of Stage 1), and the beginner's leap is its own concept `leap`, the advanced `leaps` ("Wide leaps") named on `blues.7` and `ragtime.9` only, only `leap` read as `interval.leap`; F2c (Entry 130): the advanced `leaps` maps to no demand (the leap detector finds a fourth or wider and cannot tell a fourth from an octave), so `blues.7`'s and `ragtime.9`'s octave-or-more leap is a concept no detector measures, and a fourth satisfies no claim of either |""")

op('after_line', D08, '119-d (G1a)', '**The first-contact fact under its own name** (G1a;',
   '| **What the learner met, and first contact from it** (G1;',
   """| **The first-contact fact under its own name** (G1a; the reviewer's required change on G1, `responses/b48342f.md`): `RunHeader.firstContact` written by the Score screen on every run it records, `unseen` on a phrase's run only (equal today, one derivation), the recheck before storing asking the relation; the phrase readers — `recordRun`, the rung state's `measured`, the history line, the evidence job's mark, the session's daily read and reads, the evidence's `unseen` condition and first-contact context — left on `unseen`, the four that need it behind `db.isPhraseRun` | a piece's run carrying sight-reading's field; a phrase's run without the relation, or the two apart; a piece's run not rechecked before storing; a consumer of general contact needing `isPhraseRun`, or reading a relation into a row written before G1a; a row from before G1a rewritten; a piece played again losing its pass, its rung credit or its history line; a phrase heard or seen before passing | `app/tests/unit/firstContactOnTheScore.test.ts` (revised: the piece, excerpt and import cases assert `firstContact` and no `unseen`, the phrase cases both, equal; added: a piece's two-tab recheck, a consumer reading the relation alone over a mixed history), `observationsFromRun.test.ts` (revised), `encounterModel.test.ts` (added: a piece played again as G1a stores it, the relation alone never a phrase; the G1-era row kept), `evidenceJobRecomputes.test.ts` (added: the phrase mark) — red on 76c9ade's source (15 of 63); 7 mutants caught; 8 reader moves, each changing a verdict (the eighth after the added case) | done (G1a, Entry 119); nothing heard; the product look identical before and after at 342 × 740 |""")

op('after_line', D08, '138-f (G1b) with 139-c (G1c)', "**The learner's projects** (G1b;",
   '| **The first-contact fact under its own name** (G1a;',
   """| **The learner's projects** (G1b; R19, R47, R18, L86; the brief approved with the reviewer's rulings, `responses/a96395d.md`): `db.ts` version 9 (`projects`), `projectStore` (`applyProjectAction`, `OFFERS`, `ACTION_STATE`, `projectIn`, the write queue, `setProjectNotes`, `addProjectSection`, `mergeProjects`, `PROJECT_STAGES`), `projectSheet`, the finish sheet's door, Progress's Projects block, the Stage 9 page, the backup's merge, `SettingsScreen.resetPracticeHistory`, Plan's project stage (G1c) | an action the sheet does not offer moving a project; a state moved by time, a run or a screen; the history rewritten; a pass made a project; opening the sheet making one; *I performed it* writing a performance run, an encounter or evidence; a project read by evidence, rung, skill, eligibility or session code; an id-only project found under another id; one piece under two ids made two projects; an import's project keyed by its id; two quick edits losing one; a section past the piece's bars; a restore putting back an older state; the Stage 9 page counting requirements or claiming completion; a Stage 9 project change moving a rung state; the sheet outliving its screen; reset keeping projects; Plan counting a project stage's rungs, drawing its bar or badging its rows (G1c); a second `PROJECT_STAGES` | `app/tests/unit/projectLifecycle.test.ts`, `projectSheet.test.ts`, `stage9ProjectsPage.test.ts`, `progressProjects.test.ts`, `projectOnTheFinishSheet.test.ts`, `tests/e2e/projects.spec.ts` (added); `backup.test.ts`, `encounterModel.test.ts` (revised) — red on the committed code; 26 mutants caught; `planProjectStage.test.ts`, `plan.spec.ts` › *Plan: a project stage counts nothing* (added, G1c); `projectLifecycle.test.ts` (revised, G1c: an import of the stage numbers alone listed apart) — red on the committed code; 8 mutants caught | done (G1b, Entry 138); nothing heard; the words unverified as pedagogy; the state gallery not run; retention and a put-away piece is Questions 1; Plan's project stage done (G1c, Entry 139), the sentence unverified as pedagogy |""")

op('after_line', D08, '126-d (G2) with 132-e/f (G2a)', "**The transfer policy over the attempt's own facts** (G2;",
   "| **The learner's projects** (G1b;",
   """| **The transfer policy over the attempt's own facts** (G2; Part 26, L59, L25, G68; the brief approved with its required change, `responses/a96395d.md`; the G1a constraint, `responses/5b14b7a.md`): `evidence/transferPolicy.ts` (`transferReading`, `sparesFailure`); `ladder.ts`'s promotion and `countsTowardsMovingDown` through it, `established`, `transferScope`; the evidence context's `relationship`, `demands` and header-sourced `firstContact`; `recordRun`'s `withAttemptFacts` and `playedCandidate`; `recomputeEvidence` keeping the facts; `transfer.ts`'s `establishing` from one ladder call; `skills.json`'s `transfer` blocks and `validate.py`'s dimension check and report line; `session.contactOf` and `BuildInput.contact`, Today loading it | a new seed of one family, a neighbouring excerpt, a duplicate, a heard piece or familiar material read as transfer; a declared difference or `differsOn` read as evidence; a legacy row, a D4 race row or a row with no first contact credited or spared; a skill without dimensions credited by a default; a right-hand success crediting the hands; a helper the ladder calls calling the ladder back; the context's first contact rebuilt from `unseen`; a recompute dropping or inventing the facts; a piece heard once or practised and pruned offered as new | `app/tests/unit/transferPolicy.test.ts` (added: the fourteen adversaries and the rules — adversaries 4, 5 and 6 revised by G2a to `unknown` (a composition already played fails closed), with the composition fact's boundary block), `transferFactsOnTheAttempt.test.ts` (added: the fact path, the reviewer's five with `ladderState` spied at one call, a reset clearing `established`), `tools/content/tests/test_skill_transfer.py` (added), `masteryLadder.test.ts`, `materialOnTheRecord.test.ts`, `transferOffer.test.ts`, `competenceSurvivesPruning.test.ts`, `evidenceByDemand.test.ts`, `help.test.ts` (revised, Entry 126's table), `tests/e2e/transfer-offer.spec.ts` (two cases added: a piece heard yesterday not offered; a read stores its facts) — red first; ten mutants caught | done (G2, Entry 126); nothing heard; the dimensions unverified as music; pre-G2 reads are unknown to the policy (Question 1); G2a (Entry 132): related-composition material reads `unknown` until the relationship carries the arrangement or section fact; three mutants caught |""")

op('after_line', D08, '134-m (X1)', "**Today's session, run** (X1;",
   "| **The transfer policy over the attempt's own facts** (G2;",
   """| **Today's session, run** (X1; Part 18, L32, X9, L113, G61, G62, U57, U71, U73; the brief approved with its required change, `responses/bf8de2d2.md`): `data/sessionRun.ts` (the record under one settings key, `validateRun`, the pure `apply`, `applySessionEvent` in one transaction, `closeSessionRun`, `scoreOutcome`, `drillOutcomeOf`); `ui/sessionRunner.ts` (`openActivity`, `sessionHandle` — opened, attempted, completed, the visible-time clock, the start-time recheck through `session.contactOf` — `transitionView`, `drawTransition`, `openOutside`); the router's `?session=`; Today's Start, Continue, running card, finish line, recompose and yesterday's close; the Score screen's and the drill's end sheets; `session.contactAssumption`; `eligibility.automaticFromList` and `session.fromList`; `METHOD_TRACKS`; the jam slot's `chordAndFeel`; `DrillScreen.measuresARun` | *Start session* opening a slot, not a session; a late callback, a stale tab or a recomposed card advancing or overwriting the record; hidden time counted; a free prompt or PDF made current or complete; easy success or failure adapting on an unknown, self-reported or unmeasured result; the transition's reason other than the composition's words; a card rebuilt under a running session; a first contact met since composition read as first contact, or this visit's viewing read as prior contact; a session's completion reaching the evidence; an unmeasured rung option or assignment offered automatically; the practice row displacing the rung's own new material by ranking; a jam line promising chords over a transposition page; *Quick check* opening a drill that measures nothing; a failed offer write opening the route | `tests/unit/sessionRun.test.ts`, `sessionAdaptation.test.ts`, `sessionRecheck.test.ts`, `sessionRunNeverEvidence.test.ts`, `todaySessionRun.test.ts`, `sessionTransition.test.ts`, `sessionClock.test.ts`, `sessionProtocol.test.ts` (added); `oneGateBoundary.test.ts`, `taughtByAncestry.test.ts`, `lessonPagePicksPassTheAdmission.test.ts`, `todayOpensWithItsRung.test.ts`, `fallbackOrder.test.ts`, `sightReadingIsNotAPiece.test.ts`, `parallelStrands.test.ts` (revised, Entry 134's table); `tests/e2e/session-run.spec.ts` (added), `today.spec.ts`, `transfer-offer.spec.ts` (revised) — red first; 19 mutants caught | done (X1, Entry 134); nothing heard; L113's coping part and the practice row's place for the reviewer (Questions 1 and 2) |""")

op('after_line', D08, '118-g (X3) with 122-b (X3a), 128-b (X3b), 129-b (X3c)', '**The import experience** (X3;',
   '| **E-tail**: the excerpt-target warning (E29)',
   """| **The import experience** (X3; E21, U72, U75, E45; the brief approved with one required change, `responses/ef80e86.md`): `ui/importSheet.ts` (the sheet, `swapHands`), `assignSheet.conversionHands` and the reused body, `help.whoseFact`, `importSourceWords`, `importStateWords`, `LibraryScreen`'s doors, row and placeholder sheet | a guess said as certain; a conversion note describing a decision the learner has undone; the store opening UI; the sheet writing a run or opening an automatic path; an id on the placeholder sheet; a swap that bypasses the store; a stated tempo said at the printed mark's number; a tempo clamped by the sheet; a swap saving over a stated tempo (X3a); a stated tempo that cannot be stated again; the field seeded from the characters typed rather than the stored score (X3b); a printed mark's number said as a quarter note's; a later tempo change said as the opening; a mark and a playback tempo that disagree said as a conversion; a whole number said that the file does not carry (X3c) | `app/tests/unit/importSheet.test.ts`, `libraryImportWords.test.ts`, `tests/e2e/import-experience.spec.ts` (added) — red on the committed code; four mutants | done (X3, Entry 118); nothing heard; the tempo control built (X3a, Entry 122) and kept after a statement (X3b, Entry 128); the file's own tempo sentence made truthful (X3c, Entry 129) |""")

op('after_line', D08, '133-g (X3d) with 137-c (X3e)', '**The tempo map** (X3d;',
   '| **The import experience** (X3;',
   """| **The tempo map** (X3d; X3e): `score/tempoFromXml.ts`, the one tempo reader, and every consumer of `model.tempoMap` (`05` §1); the import door keeping a timewise file as its partwise twin (`score/toPartwise.ts`, X3e) | a mark's number read as quarter notes whatever its note; a mark beating the `<sound tempo>` beside it; a later mark displacing an opening sound; a `<sound tempo>` in a bar ignored; a change in a repeat, or a bar repeated alone, played once; the count-in at a tempo the label does not say; the import sheet and the Score screen naming two numbers; a timewise import stored as it came, which the engraver refuses and the reader reads no tempo from (X3e) | `app/tests/unit/tempoFromXml.test.ts`, `scoreModelTempo.test.ts` (the reviewer's six adversaries and the two bundled pieces through the real extraction: map, label, timetable, count-in; seen red on the committed map), `importSheet.test.ts` (the line's number is the model's opening), `tests/e2e/import-experience.spec.ts` (the half-note file 120 on the Score screen and in the dev harness's model; stated 100, the label 100; seen red on the committed build: 60, 50); `toPartwise.test.ts`; `scoreModelTempo.test.ts` and `importSheet.test.ts`'s timewise twins through the door; `import-experience.spec.ts`'s timewise half-note file (seen red on the committed build: the app's 100 on the sheet, *Could not open this score* on the Score screen) (X3e) | done (X3d, Entry 133); three mutants red |""")

op('replace', D08, '127-d (U82)', '`tests/e2e/score.slide.spec.ts` (sideways: the window said',
   """`tests/e2e/score-fit-paths.spec.ts` (the two paths settled alike; the first frame is the settled layout on both)""",
   """`tests/e2e/score-fit-paths.spec.ts` (the two paths settled alike; the first frame is the settled layout on both), `tests/e2e/score.slide.spec.ts` (sideways: the window said is the window on the glass from the first draw, U82)""")

op('after_line', D08, '125-c (U80)', "**The tablet side panel's arrival** (U80)",
   '| **The first window at open, on every path in** (U74;',
   """| **The tablet side panel's arrival** (U80) | the panel decided after the score's first draw, so the music was drawn without the column and refitted narrower when it arrived; nothing marked the decision (`data-side` read `empty` from construction, as a panel left out does), so the sweep read the panel before it was filled and, on a loaded runner, found none drawn | `tests/unit/scoreSidePanelDecision.test.ts` (the mark, once per opening, each opening its own; the renderer made after the decision or the bound; the phone waits for nothing), `tests/e2e/side-panel-prose.spec.ts` (every case reads the panel after `data-side` is decided) — the unit cases red on the committed code, the sweep red on it with late lesson reads | done (U80, 2026-09-29); the stage's height change after the first draw (the control bar) is U74's follow-up; the word for a panel left out stays `empty`, the stylesheet's |""")

# ============================== docs/08: how to run the pieces ==================================

op('after', D08, '120-b (Q65a) with 124-a (Q65b)', '**The minimum for a landing**',
   """docs' checks waiting for the next code push — Q63's first form, which ef80e86 and b51579a replaced;
Doc-splice, Entry 121.)""",
   '\n\n' + w("""**The minimum for a landing** is `docs/prompts/checks.json`, printed by
  `tools/docs/checks_for_paths.py <path>...` (Q65; its semantics Q65a). For each changed path it
  names the smallest set of checks that can tell the mechanisms the path reaches apart, plus the
  cheap guards: typecheck, lint, the unit suite and the app build for app code; the content build,
  the validator and the record check for content and the pipeline. Browser specs are named from
  this file's lines and the landing chains. The whole default Playwright configuration is named
  only for a module on every spec's path (the entry and boot, the shell, the router, the global
  style, the build and test configuration, the Playwright harness), each with what it reaches. A
  test-side helper names the spec files that import it, and `test_checks_for_paths.py` fails when a
  new importer is not named. The two screen frames, `screenFrame.ts` and `subScreen.ts`, name the
  union of the specs the map gives the screens that reach them by import (Q65b). The test finds
  those screens in the source and fails when one's set is not contained or one has no set of its
  own. The full suites are merged-tree CI's and the fallback's: a path no pattern names takes them
  and is printed as unmatched. Judgement adds; the map never subtracts. A spec named on a Playwright
  command line that does not exist is a filter matching nothing and is skipped without a word; G1's
  and U74's chains named `sight-reading.spec.ts`. The map's names are checked against the tree.""", 98))

# ============================== docs/08: the e2e list ==========================================

op('after_line', D08, '118-j (X3) with 128-c (X3b), 133-k (X3d)', '`import-experience.spec.ts` — the learner path',
   '- `help-strip.spec.ts` —',
   """- `import-experience.spec.ts` — the learner path on the production build, and the share door; fixture `left-hand-first.mid` (X3); the learner's tempo stated and stated again, from the sheet to the Score screen's label (X3a, X3b); a marked file's tempo on the Score screen and a statement on it (X3d).""")

op('replace', D08, '123-e (F2b)', 'since F2b the two leaps on Skills at 342',
   """- `plan.spec.ts` — Plan, the lesson page and Skills review: every lesson openable, a self-pass badged apart.""",
   """- `plan.spec.ts` — Plan, the lesson page and Skills review: every lesson openable, a self-pass badged apart; since F2b the two leaps on Skills at 342 × 740: the Stage 2 entry is the fourth or fifth, taught in 2.1, with its own finder; the advanced "Wide leaps" from Stage 7 with its own; each name read whole; no entry called just "Leaps".""")

op('replace', D08, '135-c (U90)', 'since U90 the F2b case on Skills at 342',
   """no entry called just "Leaps".""",
   """no entry called just "Leaps"; since U90 the F2b case on Skills at 342 × 740 runs twice, on the app's font stack and with every element forced to a wider face (Verdana, or DejaVu Sans), and ends by reading every name Skills draws over every stage whole, concept and exercise rows alike.""")

op('replace', D08, '139-e (G1c)', "a project stage's line, bar and rows at 342 × 740 beside Stage 8's",
   """whole, concept and exercise rows alike.""",
   """whole, concept and exercise rows alike; a project stage's line, bar and rows at 342 × 740 beside Stage 8's unchanged (G1c).""")

op('after_line', D08, '138-g (G1b)', "`projects.spec.ts` — the learner's projects (G1b)",
   '- `progress.spec.ts` —',
   """- `projects.spec.ts` — the learner's projects (G1b): a run finished, *What next with this piece?*, *Learn this*, Progress listing it; *Put it away* then *Bring it back* from Progress, the history and encounter lines, no session written; a Stage 9 unit's page with its songs *not started*, no count, and one project's state on its row alone.""")

op('replace', D08, '127-b (U82)', 'U82: it had asserted the count asked',
   """- `score.slide.spec.ts` — sideways the sheet slides by bar, holding the cursor about a third across.""",
   """- `score.slide.spec.ts` — sideways the sheet slides by bar, holding the cursor about a third across; and the window holds as many of the asked bars as reach across at the size the height gives — every note of them inside the stage, at once and once settled, the next bar's first note after them, fewer said as `across` only when one more bar and the start of the one after it would not reach across (U82: it had asserted the count asked, which the renderer said only before the piece was measured).""")

op('after_line', D08, '134-n (X1)', "`session-run.spec.ts` — Today's session run at 342",
   '- `score.strip-span.spec.ts` —',
   """- `session-run.spec.ts` — Today's session run at 342 × 740 (X1): two drills ended and two pieces played with the transition after each, Continue after a reload mid-activity, the finish line; the tablet; the reading slot's phrase heard at noon from the card, rechecked and repurposed in the evening.""")

op('replace', D08, '125-d (U80)', "Every case reads the panel only after the screen's `data-side`",
   """swept over one lesson per track.""",
   """swept over one lesson per track. Every case reads the panel only after the screen's `data-side` says it is decided, `text` or `empty` (U80); the sweep used to read it as the screen appeared and, on a loaded runner, found none drawn.""")

# ============================== docs/08: the unit list =========================================

op('replace', D08, '138-m (G1b)', 'the projects (G1b)',
   """the encounters and the summaries of pruned runs (G1).""",
   """the encounters and the summaries of pruned runs (G1); the projects (G1b).""")

op('replace', D08, '138-n (G1b)', ', through version 9 since G1b',
   """the version-7 upgrade leaving every store as it was;""",
   """the version-7 upgrade leaving every store as it was, through version 9 since G1b;""")

op('replace', D08, '119-f (G1a)', 'since G1a, a piece played again as G1a stores it',
   """flagged nothing; the Score screen the one writer.""",
   """flagged nothing; the Score screen the one writer; since G1a, a piece played again as G1a stores it, and the relation alone never a phrase.""")

op('replace', D08, '119-e (G1a)', 'Since G1a the relation as `firstContact` on every run',
   """an excerpt beside other bars and of a piece played whole, a duplicate import by its bytes.""",
   """an excerpt beside other bars and of a piece played whole, a duplicate import by its bytes. Since G1a the relation as `firstContact` on every run and `unseen` on a phrase's only, equal there; a piece's run rechecked before storing; a consumer reading the relation alone over phrase runs, piece runs, a row G1's app wrote and rows from before G1, nothing manufactured on the old rows.""")

op('replace', D08, '119-g (G1a)', 'with `firstContact` beside it since G1a',
   """`unseen` true and false, and on a piece since G1, `demonstrated`.""",
   """`unseen` true and false, with `firstContact` beside it since G1a, and on a piece `firstContact` without `unseen`; and on a piece since G1, `demonstrated`.""")

op('replace', D08, '119-h (G1a)', "since G1a, a gone piece's run carrying the relation",
   """one row per idle slice after the first screen, newest first.""",
   """one row per idle slice after the first screen, newest first; since G1a, a gone piece's run carrying the relation or G1's flag is not the job's, and a flag-only phrase row of a gone reading row is.""")

op('after_line', D08, '118-h (X3) with 122-c (X3a), 128-d (X3b), 129-c (X3c), 133-j (X3d)', '`importSheet.test.ts` — the import sheet from the stored row',
   '- `importOverlay.test.ts` —',
   """- `importSheet.test.ts` — the import sheet from the stored row, U72 on both sheets, the swap through the store, no run from the sheet, the store opening nothing (X3); the learner's tempo through the store: the control, the call, the re-read row, the store's refusal, the two writers one at a time, the line in quarter notes (X3a); a stated tempo stated again: the control under the learner's tempo, the seeding rule, the twice-stated case (the second statement in the line, the score, the row, the measurement, the fact and the player's tempo; the first nowhere) (X3b); the file's own tempo: the mark in its own note beside the opening tempo, one number for a quarter mark, a later mark never the opening, a text mark as printed and read, disagreement said apart, the fractional policy (X3c); the number the line names is the tempo the Score screen opens at; a mark alone said with its quarter notes (X3d).""")

op('replace', D08, '123-d (F2b)', "since F2b the practice floor stands on 1.1 and Today's practice row",
   """since F2 a demand a rung only introduces is not taught (a constructed path and the shipped `blues.5`, with `blues.6` the blues path's teaching rung).""",
   """since F2 a demand a rung only introduces is not taught (a constructed path and the shipped `blues.5`, with `blues.6` the blues path's teaching rung); since F2b the practice floor stands on 1.1 and Today's practice row is absent at 1.1, there at 1.2 and 1.5, absent at 2.1 (a session build).""")

op('replace', D08, '133-l (X3d), 136-e (Q76)', "ragtime.6's tempo check now reads the reader's placement",
   """plus four sweeps over all 109 lessons.""",
   """plus four sweeps over all 109 lessons; since X3d ragtime.6's tempo check now reads the reader's placement; ragtime.8's two claims rewritten for Q76: five rags from one non-public-domain edition and Pine Apple Rag again from Mutopia; the blind button's first of seven.""")

op('after_line', D08, '118-i (X3)', '`libraryImportWords.test.ts` — the row',
   '- `levelSource.test.ts` —',
   """- `libraryImportWords.test.ts` — the row's source and state words, the Library's picker opening the sheet from the returned row, the placeholder sheet without ids, E45 (X3).""")

op('after_line', D08, '139-d (G1c)', '`planProjectStage.test.ts` — Plan reads a project stage',
   '- `planNoUnobtainableRungs.test.ts` —',
   """- `planProjectStage.test.ts` — Plan reads a project stage as the lesson page does (G1c): with Stage 9 rungs met, in progress, marked done and carried, the line is the page's sentence, no count, bar or *complete*, and no row wears a rung's word; every other stage's line, bar and badges as before; the legend only for fills a stage draws; one `PROJECT_STAGES`, the session and Plan importing the store's.""")

op('after_line', D08, '138-h (G1b)', "`progressProjects.test.ts` — Progress's Projects block",
   '- `progressHistoryLines.test.ts` —',
   """- `progressProjects.test.ts` — Progress's Projects block (G1b): newest change first with state, since and goal; *Make it a project* for a passed song with no project and not for one with a project, one only started or an exercise; the offer making nothing until chosen; a row opening its sheet, closed with the screen; the empty sentence.""")

op('after_line', D08, '138-i/j/k (G1b) with 139-f (G1c)', '`projectLifecycle.test.ts` — the repertoire lifecycle',
   '- `progressStore.test.ts` —',
   '\n'.join([
       """- `projectLifecycle.test.ts` — the repertoire lifecycle (G1b): the version-8 upgrade leaving every store as it was; the row and its append-only history; the transitions table from every state, the rest refused; *I performed it*'s day; R18's goal, problem and sections; identity by material, an id-only row its own id's; the backup's replace and merge join; learned pieces, contact, familiarity, the rung state and the skill ladders unchanged across every action; the project sheet the one caller; *I performed it* manufacturing nothing; Part 27's adversaries; the session and Plan importing only the project stages' constant (G1c).""",
       """- `projectOnTheFinishSheet.test.ts` — the finish sheet's door (G1b), on the real Score screen: offered on a song and not a phrase; the sheet reading the run just played and making nothing until a choice; an import's project its bytes; the sheet closing with the screen.""",
       """- `projectSheet.test.ts` — the project sheet (G1b): no project, four choices, *never opened*; the encounter line's kinds; *Learn this*; put away and brought back; *I performed it* with a date and nothing else written; the notes and a refused section; closed with its screen; *Reset progress* clearing the projects.""",
   ]))

op('replace', D08, '126-h (G2)', 'a fifth moving exactly where the policy says demonstrated (G2)',
   """and no ladder or rung state moving for them on four constructed histories.""",
   """and no ladder or rung state moving for them on four constructed histories, a fifth moving exactly where the policy says demonstrated (G2).""")

op('replace', D08, '126-g (G2) with 132-h (G2a)', "transfer where a first reading's facts differ on the skill's dimensions",
   """transfer on another item's first reading, retained 21 days on, mastered; self-assessed apart; time lowers nothing; a heard phrase refused; two teacher histories — the steady reader transfers, and the stretch onto harder material stays proficient (`countsTowardsMovingDown`).""",
   """transfer where a first reading's facts differ on the skill's dimensions (another row with its facts; never a new seed; no facts unknown), retained 21 days on, mastered; self-assessed apart; time lowers nothing; a heard phrase refused; two teacher histories — the steady reader transfers, and the stretch onto harder material stays proficient on its facts and goes back to familiar without them (`countsTowardsMovingDown`, G2); another cut of a piece already played neither transfers nor is spared, while the same read without the composition fact transfers on its key and is spared (G2a).""")

op('after_line', D08, '134-o (X1): the seven session unit files', "`sessionRun.test.ts` — the session record's state machine",
   '- `session.test.ts` —',
   '\n'.join([
       """- `sessionAdaptation.test.ts` — the runner's two bounded adaptations (X1) and the stored-run readers.""",
       """- `sessionClock.test.ts` — visible time only (X1).""",
       """- `sessionProtocol.test.ts` — every composed guided slot opens as a Score run or a drill and carries its contact; the route's token; G61; U71; U57 (X1).""",
       """- `sessionRecheck.test.ts` — a first-contact activity rechecked at its start through the session's one contact reader (X1): heard at noon means repurposed; this visit's viewing and an id-only row hold.""",
       """- `sessionRun.test.ts` — the session record's state machine and store (X1): start, next, skip, move on, finish, choose, swap, time; every write validated by id, version and token; corrupt records discarded; two tabs; another day; recomposed.""",
       """- `sessionRunNeverEvidence.test.ts` — no evidence, rung-state or progress reader reads the session record, and a whole session changes nothing they read (X1).""",
       """- `sessionTransition.test.ts` — the transition on a finished activity's sheet (X1).""",
   ]))

op('after_line', D08, '133-i (X3d)', "`scoreModelTempo.test.ts` — the model's map from the file",
   '- `scoreModel.test.ts` —',
   """- `scoreModelTempo.test.ts` — the model's map from the file through OSMD: the reviewer's adversaries, a mid-bar change, repeats, E32 after bar 1, the Fifth's opening, the default, *Row, Row, Row* at 81 and *Canon in D* at 100 (X3d).""")

op('after_line', D08, '125-e (U80)', '`scoreSidePanelDecision.test.ts` — the tablet side panel',
   '- `scoreSheetRows.test.ts` —',
   """- `scoreSidePanelDecision.test.ts` — the tablet side panel's decision on the Score screen (U80): `data-side` absent until decided, `text` when the lesson reads, `empty` for a piece on no rung or a lesson that will not read, once per opening and each opening its own (a lesson landing after the next piece has opened stays on its own screen); the renderer made after the decision, or after the bound when a lesson never answers; a phone decided at once with nothing waiting.""")

op('after_line', D08, '138-l (G1b)', "`stage9ProjectsPage.test.ts` — Stage 9's page",
   '- `staffCard.test.ts` —',
   """- `stage9ProjectsPage.test.ts` — Stage 9's page (G1b, L86): songs as projects, *not started*, the sentence, no count, no *Mark done*; met requirements changing nothing there; one project's change on its row alone and no rung, evidence, admission or skill state; an ordinary rung's page as before.""")

op('after_line', D08, '133-h (X3d)', '`tempoFromXml.test.ts` — the one tempo reader',
   '- `techniqueMeasures.test.ts` —',
   """- `tempoFromXml.test.ts` — the one tempo reader: the normalisation table, sound over mark, positions, what is not a tempo, the opening and nothing sounding before it (X3d).""")

op('after_line', D08, '137-d (X3e)', "`toPartwise.test.ts` — the door's timewise-to-partwise conversion",
   '- `toastStack.test.ts` —',
   """- `toPartwise.test.ts` — the door's timewise-to-partwise conversion: the round trip, a missing part, comments, a laid-out file (X3e).""")

op('after_line', D08, '134-o (X1): todaySessionRun', "`todaySessionRun.test.ts` — Today runs the session (X1)",
   '- `todaySessionLength.test.ts` —',
   """- `todaySessionRun.test.ts` — Today runs the session (X1): Start, Continue, the running card, choose, swap, the finish line, an early end, another day, Shuffle, a corrupt record, U73, U71, Part 20's cases.""")

op('before_line', D08, '126-f (G2)', '`transferFactsOnTheAttempt.test.ts` — the fact path (G2)',
   '- `transferOffer.test.ts` —',
   """- `transferFactsOnTheAttempt.test.ts` — the fact path (G2): the context's first contact from the header, `recordRun`'s relationship and demands, a recompute keeping them, the ladder's five over constructed evidence calling itself once, `transfer.ts` asking the ladder once, a reset clearing `established`.""")

op('replace', D08, '126-i (G2)', 'a piece heard once or practised and pruned `met` through `contactOf`',
   """of the establishing family, beyond proficient, a reading row, an unreviewed study, an excerpt undecided, unplaced or differing in nothing known; an approved, placed excerpt offered.""",
   """of the establishing family, beyond proficient (by the policy), a reading row, an unreviewed study, an excerpt undecided, unplaced or differing in nothing known; an approved, placed excerpt offered; a piece heard once or practised and pruned `met` through `contactOf` and never offered (G2).""")

op('before_line', D08, '126-e (G2) with 132-g (G2a)', '`transferPolicy.test.ts` — the transfer policy (G2)',
   '- `transferRelationship.test.ts` —',
   """- `transferPolicy.test.ts` — the transfer policy (G2): Part 26's fourteen adversaries on constructed contexts, declared and measured apart, `differsOn` never read, unknown never credited or spared, a skill without a block credited nothing; a composition already played read before the dimensions and never credited, a new section and a different arrangement alike, `playedAs: []` and the earlier facts unchanged (G2a).""")

op('replace', D08, '127-c (U82)', 'fewer said as `across` — from the first draw, and over bars',
   """`data-settled` is said a frame after the fit and taken back by a stage change.""",
   """`data-settled` is said a frame after the fit and taken back by a stage change; sideways, the count follows what reaches across at the height's size — fewer said as `across` — from the first draw, and over bars that reach across the count asked (U82).""")

op('after_line', D08, '137-e (X3e)', "`helpers/timewise.ts` — a partwise fixture's timewise twin",
   '- `helpers/` — shared fixtures and fakes, not tests.',
   """- `helpers/timewise.ts` — a partwise fixture's timewise twin (X3e).""")

# ============================== docs/08: tools/content/tests ===================================

op('replace', D08, '120-d (Q65a) with 124-b/c (Q65b)', 'Since Q65a it also holds the minimum semantics',
   """a lesson edit is covered, and a docs-only change runs nothing (Q-tooling).""",
   """a lesson edit is covered, and a docs-only change runs nothing (Q-tooling). Since Q65a it also holds the minimum semantics: the Score screen, the renderer, the store, the session, Today and the engine name specs that `docs/08` or a landing chain ties to them, not the whole suite, and keep the unit suite, typecheck, lint and the build; the Playwright harness, the router, the entry, the shell and the global style stay the whole suite; `docs/04` runs its five unit readers, and `docs/00` runs nothing and is matched; the shared fixtures run the converter's checks, and the score model runs the content measurement; a test-side helper's list names every spec, unit file and content test that reads it (a spec that opens a shared fixture by a `path.join` from its own folder counts, Q65b); the two screen frames name the union of the browser specs the map gives the screens that reach them by import, the importers found from the import statements at test time, the walk stopping at the shell and the entry, the reason naming each importer (Q65b). `docs/prompts/runs/Q65a/scripts-mutants.py` and `docs/prompts/runs/Q65b/scripts-mutants.py` show each case catching its mutant.""")

op('replace', D08, '123-c (F2b) with 130-c (F2c), 136-d (Q76)', "since F2b the practice floor's one untaught row",
   """the moved options, the practice floor, the rock placeholders on no rung.""",
   """the moved options, the practice floor, the rock placeholders on no rung; since F2b the practice floor's one untaught row is the study's skips and no practice rung reads a step untaught, the leap's sources are `leap` and `leaps`, and every demand several concepts share is marked on the candidate-rungs lines (the left-hand pattern; since F2c not the leap); since F2c neither `blues.7` nor `ragtime.9` claims the leap, and no excerpt is a candidate for either (the Anh. 113 cut among them); and since Q76 `mutopia` among the sources a row may come from.""")

op('replace', D08, '130-d (F2c)', 'since F2c no study is a candidate for `blues.7`',
   """since D3a, the report making placement no owner's.""",
   """since D3a, the report making placement no owner's; since F2c no study is a candidate for `blues.7` or `ragtime.9`, and the 2.1 studies keep 2.1's beginner leap.""")

op('replace', D08, '123-b (F2b) with 130-b (F2c)', 'since F2b `practice.1` stands on 1.1 (the floor',
   """the walking bass is `jazz.6`'s, `blues.6`'s and `jam.6`'s (`blues.5` introduces it).""",
   """the walking bass is `jazz.6`'s, `blues.6`'s and `jam.6`'s (`blues.5` introduces it); since F2b `practice.1` stands on 1.1 (the floor's steps taught, the study's skips not), and the two leaps are two concepts (`leap` on 1.5 and 2.1, `leaps` on `blues.7` and `ragtime.9`), no leap name shared, the shared concept names exactly the recorded ten; since F2c the advanced `leaps` maps to no demand: `blues.7` and `ragtime.9` claim no leap, and a fourth-only reading keeps none of their claims and keeps 2.1's.""")

op('replace', D08, '131-b (Q75)', 'since Q75 an unmeasured option counted apart from the checked ones',
   """the requirement an introduction never meets, the introducing rung `taughtAt` may not list.""",
   """the requirement an introduction never meets, the introducing rung `taughtAt` may not list; and since Q75 an unmeasured option counted apart from the checked ones: a claim it might keep warned as not judged on that build, never failed; the report's unmeasured counts.""")


# ============================== the engine ======================================================

def norm(s: str) -> str:
    """Whitespace collapsed: a key phrase is found however the file wraps it."""
    return ' '.join(s.split())


def has(doc: str, key: str) -> bool:
    return norm(key) in norm(doc)


def line_of(doc: str, key: str) -> int:
    """The line on which the key phrase starts, read across the file's wrapping; 0 where absent."""
    words: list[str] = []
    at: list[int] = []
    for number, line in enumerate(doc.split('\n'), 1):
        for token in line.split():
            words.append(token)
            at.append(number)
    joined = ' '.join(words)
    pos = joined.find(norm(key))
    return 0 if pos < 0 else at[joined[:pos].count(' ')]


def main() -> int:
    dry = '--dry' in sys.argv
    texts: dict[str, str] = {}
    for f in {o['file'] for o in OPS}:
        raw = (ROOT / f).read_bytes().decode('utf-8')
        texts[f] = raw.replace('\r\n', '\n')
    results = []
    refused = 0
    for o in OPS:
        doc = texts[o['file']]
        if has(doc, o['key']):
            results.append((o, 'already present'))
            continue
        a = o['anchor']
        if o['kind'] in ('after', 'replace'):
            n = doc.count(a)
            if n != 1:
                results.append((o, f'REFUSED: anchor found {n} times'))
                refused += 1
                continue
            i = doc.index(a)
            new = doc[:i] + (a + o['text'] if o['kind'] == 'after' else o['text']) + doc[i + len(a):]
        else:  # after_line / before_line: the one line holding the anchor
            lines = doc.split('\n')
            hits = [k for k, line in enumerate(lines) if a in line]
            if len(hits) != 1:
                results.append((o, f'REFUSED: anchor line found {len(hits)} times'))
                refused += 1
                continue
            k = hits[0]
            block = o['text'].split('\n')
            lines[k + 1:k + 1] = block if o['kind'] == 'after_line' else []
            if o['kind'] == 'before_line':
                lines[k:k] = block
            new = '\n'.join(lines)
        if not has(new, o['key']):
            results.append((o, 'REFUSED: key not in the result'))
            refused += 1
            continue
        texts[o['file']] = new
        results.append((o, 'spliced'))
    # Where each operation's text stands in the file as written: the line its key phrase starts on,
    # and how many lines its text takes (a replacement counts the lines of its new text).
    for o, status in results:
        doc = texts[o['file']]
        start = line_of(doc, o['key'])
        span = o['text'].strip('\n').count('\n')
        where = f'{start}' if span == 0 else f'{start} (+{span})'
        print(f"{status:<18} {o['file']:<32} lines {where:<11} {o['row']}")
    print(f'{len(OPS)} operations; {sum(1 for _o, s in results if s == "spliced")} spliced; '
          f'{sum(1 for _o, s in results if s == "already present")} already present; {refused} refused')
    if refused:
        print('nothing written: an anchor was refused')
        return 1
    if not dry:
        for f, text in texts.items():
            (ROOT / f).write_bytes(text.replace('\n', '\r\n').encode('utf-8'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
