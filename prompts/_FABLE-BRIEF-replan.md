# Brief for Fable — replan PianoPath around a real library

You are architecting, not implementing. Everything you produce is **input for Opus**, which
does the work in a separate session against this repository. Your output is prompt files and
one decision document; you write no application code and no content.

Read this whole brief, then read the repository, then produce what §7 asks for.

---

## 1. How this project works, and how your output has to fit it

PianoPath is built by feeding numbered prompts to Opus, one phase at a time. The convention is
already established and you must follow it exactly:

- `prompts/_COMMON-HEADER.md` is included in every prompt and is **binding**: the branch is
  named in the prompt; commit early with conventional commits; **never name an AI model in a
  commit, a code comment or any repository artifact**; every claim must be backed by a command
  actually run, with the command and its output pasted into the final report; keep to the
  prompt's scope and put anything else under "Follow-ups"; when the docs give no default and
  the choice matters, pick the simpler option, say so, and continue.
- The final-report format is fixed: **Done** (bullets, each with the command that verifies it)
  · **Not done / blocked** · **Follow-ups** · **Questions for the owner** · **Files touched**.
- Docs are normative. A deviation from them is legitimate only if it is written up in
  `docs/decisions/<date>-<topic>.md` and the doc it contradicts is updated.
- The default branch is `claude/piano-teaching-app-bo19td`. **There is no `main`.** See
  `docs/decisions/2026-09-05-default-branch.md`. Feature branches are `feat/<phase>-<slug>`.

Look at `prompts/P7-app-screens-storage.md` and `prompts/P9-device-qa-perf.md` for the house
style: a short "Read:" line naming the doc sections, a numbered "Build / verify" list where
each item states what must be true and how it is proved, explicit acceptance criteria, and a
frank note about what cannot be checked in the container.

## 2. Read before you decide anything

- `docs/00-overview.md` — the decisions ledger, `D1`…`D21`. `D10a`, `D19`, `D20`, `D21` matter
  most here.
- `docs/01-architecture.md` — §6 budgets, §7 offline, §9 hosting.
- `docs/02-curriculum.md` — Parts A–G. The stage ladder, the track ladders (`D1` classical,
  `D5` ragtime, and the rest), and Part G's mastery rules.
- `docs/03-content-pipeline.md` — §1 the licence rules, §2 the source tiers, §3 the steps.
- `docs/04-ui-spec.md`, `docs/05-score-follow-engine.md` — the screens and the engine.
- `docs/06-build-plan.md` — the phase plan and the definition of done.
- `docs/OWNER-GUIDE.md` — what the owner actually does with the thing.
- **Every file in `docs/decisions/`.** Eighteen of them. They are the record of what was tried,
  what broke, and why the code looks the way it does. The two most recent
  (`2026-09-06-p10-kern-import.md`, `2026-09-06-p10-chopin-and-breadth.md`) describe the
  content pipeline as it stands today, including three unresolved problems.
- `tools/content/` — `build.py`, `licensing.py`, `convert.py`, `import_kern.py`,
  `import_musetrainer.py`, `generate_exercises.py`, `author.py`, `validate.py`,
  `render_check.py`, and the tests beside them.
- `content/` — `catalog.schema.json`, `curriculum.schema.json`, `curriculum/*.json`,
  `lessons/*.md`, `sources/*.json`.
- `app/src/` — in particular `curriculum/`, `engine/drills/`, `ui/screens/`, `score/`, `data/`.

## 3. Constraints that are already decided — do not relitigate

1. **The app is for one person.** No accounts, no sync, no telemetry. It is a PWA wrapped as a
   TWA APK for a Samsung Galaxy S25, and it must work with the network off (`00` D19, D20).
2. **Offline-first.** The whole library is precached. Anything that needs the network at
   practice time is wrong. Video links are the one exception and they say so before the tap.
3. **The licence gate is code, not a checklist** (`tools/content/licensing.py`). Two
   independent questions per file: is the *composition* public domain in the US, and does the
   *edition* permit redistribution. `--allow-nc` relaxes CC BY-NC for the owner's personal
   build only; it relaxes nothing else, and a file that states no licence is never admitted.
   The public GitHub Pages build runs `--strict-license`.
4. **PDF display yes, PDF scanning no.** Optical music recognition was ruled out
   (`docs/decisions/2026-09-05-p4-pdf-sheet-music.md`). The PDF viewer detects systems by
   projection profile and the owner can adjust the cuts by hand.
5. **Exercises are first-class.** The owner asked for this explicitly: not everything needs to
   be a song, and there must always be something to work on for any single skill.
6. **Three alternatives at every rung, minimum** (`00` D21), enforced by `validate.py` rather
   than trusted. Three is a floor for a rung that cannot do better, not a target.
7. **Mastery** (`02` Part G): pass = ≥90 % accuracy at ≥80 % tempo; master = ≥97 % at 100 %,
   on two different days; review at 1, 3, 7 and 21 days.
8. **The container that builds this cannot reach the open internet.** Egress is GitHub, npm
   and PyPI only — `zenodo.org`, `imslp.org`, `musescore.com`, `mutopiaproject.org` and
   `kern.humdrum.org` all fail to connect. CI cannot reach them either. Any design that
   requires fetching from those hosts at build time is dead on arrival; this shapes §6.1
   and §6.3 below more than anything else in this brief.

## 4. Where the project actually is

Phases P0–P9 are done and merged; P10 (content expansion) is in progress on
`feat/p10-content-2`, which is pushed and unmerged.

Working and verified: MIDI and audio input, score rendering with a windowed renderer, the
practice engine with scoring and mastery, microphone pitch detection, the content pipeline,
all the app screens, storage with export/import, twelve kinds of drill, the performance
budgets under ×4 CPU throttling, offline, and the TWA packaging (never yet built into an
actual APK — that needs the owner's keystore and his phone).

The catalog today is **802 items**: 326 songs, 430 exercises, 46 drills. Its shape is the
problem you are being asked to fix.

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| **Songs** | 14 | 9 | 6 | 11 | 11 | 39 | 116 | 73 | 47 |
| **Exercises** | 48 | 70 | 63 | 225 | 24 | 0 | 0 | 0 | 0 |
| **Drills** | 10 | 6 | 12 | 8 | 4 | 0 | 0 | 0 | 0 |

Read that table carefully, because it is the whole brief in one picture:

- **236 of 326 songs are Grade 6 or harder.** Below Stage 5 there are 51 songs, several of
  which are variants of the same folk tune. The owner is at the bottom of the ladder and the
  library is stacked at the top.
- **Exercises stop at level 5 and drills stop at level 5.** There is nothing generated for the
  upper half of the ladder at all, and the level-4 bucket (225 items) is a bulge caused by how
  the scale and arpeggio generators are parameterised rather than by a judgement about
  difficulty.
- Tracks are lopsided: `jazz` has 3 items, `hymns-gospel` 2, `improv-compose` 6,
  `blues-boogie` 6, while `classical` has 297.

Sources in use: `musetrainer/library` (69 MusicXML files, a blanket public-domain claim with
no per-file terms — every file is judged individually), `craigsapp/joplin` (47 rags,
CC BY-NC-SA, personal build only), `pl-wnifc/humdrum-chopin-first-editions` (169 imported of
183 surveyed, CC BY 4.0, no flag needed), plus generated exercises and hand-authored ABC.

## 5. Known problems, all of which you should rule on

Do not treat these as someone else's mess to route around. Decide what happens to each, and
say so in your decision document.

1. **Thirteen Chopin scores convert cleanly and match their sources note for note, but
   OpenSheetMusicDisplay's VexFlow refuses to draw them** — `Invalid note initialization
   object: {}`. Grace notes and beams were both tested and ruled out. They are excluded with
   the error recorded in `content/sources/kern.json`. The reproduction is one `loadUrl` call
   in the `/dev/score` route. Is this worth root-causing, worth an upstream issue, worth a
   fallback renderer, or worth living with?
2. **Étude Op. 25 no. 7** cannot be exported at all: a 29-in-24 tuplet based on a 2048th note,
   and MusicXML stops at 1024th.
3. **The content build takes about seven minutes and the render check about ten**, and CI runs
   both. Most of it is music21 converting Humdrum and OSMD engraving. The obvious fix is
   caching converted `.mxl` by source checksum. Decide whether that is worth a phase.
4. **129 catalog items carry a `level-banded` tag** — their level is an estimate from genre and
   opus rather than a judgement about the piece. That tag needs to mean something in the app,
   or it should not exist.
5. **`docs/02`'s ladders name pieces that no reachable source has**: Joplin's *Euphonic
   Sounds*, James Scott's *Frog Legs Rag*, Joseph Lamb's *Ragtime Nightingale*, Scarlatti
   K.32 / K.9 / K.380. Bach's Two-Part Inventions and the Well-Tempered Clavier exist as
   Humdrum under `humdrum-tools/` but every file reserves all rights.
6. **The ragtime Stage 5 rung offers the complete original *Entertainer*** where `02` D5 asks
   for an easy arrangement, because no easy arrangement exists in the library.
7. **`level` and rung number disagree by design and it is not written down anywhere a user
   sees.** `02` D5 puts *The Entertainer* at ragtime Stage 6; the catalog levels it 7.1,
   because `level` is a global difficulty used for swaps while the rung is a within-track
   order. Decide whether that stands, and if it does, where it gets explained.
8. **The catalog schema's track enum and `content/curriculum/00-tracks.json` are two sources
   of truth for the same list** and had already drifted apart.
9. **The router silently drops a route when two hash changes land in the same task.**
   `Router`'s `hashchange` listener reads `location.hash` when it runs rather than from the
   event, and `setRoute` returns early when the route matches the current one. Navigate
   score → today → score fast enough and the browser coalesces the events, the listener sees
   the score hash twice, and the screen is never remounted — the previous exercise stays on
   the stage. It surfaced as a CI-only test failure on a two-core runner. No user taps that
   fast, so the severity is low; the design question is whether re-entering a route should
   ever be a no-op, given that a sight-reading rung is supposed to generate new material every
   time it is opened.

## 6. What the owner wants, and what you have to design

These are his words, turned into six problems. Solve them together, not separately — several
of them are the same problem seen from different sides.

### 6.1 PDMX becomes the library

He is downloading **PDMX** (`https://zenodo.org/records/14648209`; the project's own README
points at `15571083`, so **the first thing any prompt must do is check which version is on
disk and record it**) — over 250,000 public-domain MusicXML scores scraped from MuseScore.
He will unpack it per the dataset's instructions, which includes rewriting the relative paths
in `PDMX.csv` and the `subset_paths/*.txt` files to absolute ones.

Of the five archives in the record, this project needs **`PDMX.csv` and `mxl.tar.gz`**, and
`subset_paths.tar.gz` if it is small. `data.tar.gz` holds MusicRender JSON, which needs the
authors' Python package and gives nothing our music21 pipeline cannot read straight from the
MXL; `pdf.tar.gz` holds rendered sheet music we have no use for. **Key off the `mxl` column,
not `path`** — `path` points into `data/`, which may not be unpacked at all, and 42 songs have
no MXL and must be skipped rather than crash a selector. Write the prompts so a partial unpack
is the expected case and a missing archive is a clear message, not a traceback.

What it gives you, per song, in `PDMX.csv`:

- `mxl` — path to a compressed MusicXML file (may be `N/A`; 42 songs are corrupt).
- `pdf` — path to rendered sheet music (may be `N/A`).
- `license`, `license_url`, `license_conflict` — **and the authors' own warning**: the
  public-facing MuseScore licence disagrees with the file's internal copyright data for 31,221
  songs (12.29 %). They recommend the `no_license_conflict` subset, which still holds 222,856.
- `subset:no_license_conflict`, `subset:valid_mxl_pdf`, `subset:deduplicated`, `subset:rated`,
  `subset:rated_deduplicated` — precomputed subsets.
- `complexity` (MuseScore's own 0–3 score), `n_tracks`, `tracks` (the instrumentation),
  `song_length.bars`, `song_length.seconds`, `n_notes`, `notes_per_bar`.
- `rating`, `n_ratings`, `n_views`, `n_favorites`, `is_official`, `is_user_pro`,
  `is_user_publisher`, `is_draft`, `has_paywall` — the paper's finding is that user-rating
  statistics are an effective proxy for quality, which is directly useful here.
- `title`, `subtitle`, `song_name`, `artist_name`, `composer_name`, `publisher`, `genres`,
  `tags`, `groups`.
- `pitch_class_entropy`, `scale_consistency`, `groove_consistency` — MusPy metrics.

Design the ingestion. Things it has to get right, at minimum:

- **The archive never enters the repository and never enters CI.** It lives on the owner's
  machine. The pipeline quarries it once and commits the *selected, converted* scores, which
  are a few kilobytes each. Work out where those live (`content/scores/` has `imported/`
  gitignored and `authored/` tracked — this is a third thing) and how a build that cannot see
  the archive still succeeds, deterministically, with a checksum for every selected file.
- **Selection, not import.** 222,856 songs is not a library, it is a haystack. Design the
  filter — solo piano or piano-dominant, licence clean by our gate and not merely by the CSV,
  deduplicated, rated, complexity and length matched to a level band — and design how a human
  reviews the shortlist before it lands.
- **Levelling.** `complexity`, `notes_per_bar`, `song_length.bars`, `pitch_class_entropy` and
  `scale_consistency` are the raw material for a level estimate. Decide the formula, decide how
  it is calibrated against the pieces already in the catalog whose levels are trustworthy, and
  decide how an estimate is marked as one (see §5.4).
- **Quality.** MuseScore transcriptions range from excellent to unplayable, and a bad one is
  worse than an absent one because it looks fine until it is played. The render check and a
  note-for-note comparison are the existing tools; decide what else is needed and what the
  rejection rate is allowed to be before the selection is reconsidered.
- **The curriculum reorients around what is found.** Not the other way round. `docs/02`'s
  ladders were written from what the owner hoped existed; the whole of §5.5 above is the cost
  of that. Decide how the ladders and the found library are reconciled, and who wins.

### 6.2 Generated material fills every gap, at every level

Exercises and drills currently stop at level 5. The owner wants "individual element training"
always available, at all levels: intervals, scales, arpeggios, chords, rhythm, sight-reading,
ear training, technique — generated as MusicXML by `generate_exercises.py` or driven at
runtime by the drill engine.

Design what is missing. Go through `docs/02` Part D and Part F concept by concept and find the
skills that have no generated exercise at all, and the levels that have none. This is the part
of the library that has no licence problem, no source problem and no ceiling: it should be the
backbone, and today it stops halfway up.

### 6.3 Every rung gets a search prompt the owner can actually use

The owner will find music himself — from MuseScore, from IMSLP, from anywhere — and drag it
into the app, which already supports importing MusicXML, MXL and PDF (P7).

He wants, **for every stage, every track rung and every concept**: a few named pieces *and* a
ready-made prompt he can paste into a search engine or a chatbot to go and find more, covering
music that is still in copyright as well as music that is not — because he is finding it for
himself, which is a different question from what the app may bundle.

Design this properly. It is not a text field on a screen. Consider at least: where the prompts
live (curriculum data, so they are versioned and validated, not hardcoded in a screen); how
they are written so the answers are actually useful (the skill being trained, the level in
words a search engine understands, the key and hand constraints, what to avoid); how a found
file gets from a download to the right rung in two taps rather than ten; how the app tells him
what a rung still needs; and how an imported file is levelled and tagged so it does not sit
outside the curriculum forever. `app/src/ui/screens/LibraryScreen.ts`,
`app/src/data/importStore.ts` and the share-target handling in the service worker are where
this lands.

### 6.4 The books he already owns become part of the curriculum

He has printed method books and sheet music. The app has a PDF viewer with system detection
and adjustable cuts. These two facts have never been connected.

Design it. A physical book is not a file: it has a name, a number of pieces, and a page number
per piece, and the owner is looking at paper while the app counts. Consider a "shelf" of books
he registers once; a way for a rung to say *"or bar 1–16 of whatever your method book has for
this"*; how practice against paper is recorded when the app cannot see the notes (the MIDI and
microphone input still work — the score does not have to be on the screen for the engine to
hear a scale); and how a scanned or bought PDF of a book he owns slots into the same shelf via
the existing viewer. Be honest about what can and cannot be scored without a machine-readable
score, and design the honest thing rather than the impressive one.

### 6.5 Every drill gets its tips and tricks

Twelve drill kinds exist (`app/src/engine/drills/`, `app/src/ui/screens/DrillScreen.ts`) and
they teach by repetition alone. The owner wants tips and tricks: what the drill is for, how to
practise it, the common mistake, how to tell you have got it. The lesson markdown files already
end with exactly those four sections — reuse the pattern rather than inventing another.

Decide where the text lives, how it reaches the drill screen without bloating the entry bundle,
and whether tips are static per drill kind or vary with the parameters and the learner's
history.

### 6.6 Robustness is a requirement, not a phase

Every one of the above must arrive with its render check, its schema validation, its
edge cases and its tests — and the pipeline's existing checks have to get better, because §5.1
and §5.3 are both cases where a check either could not see the failure or cost more than it
was worth. Note in particular that the render check only recently learned to read the load
error it was already being told about; assume there are more blind spots of that kind and go
looking.

## 7. What to produce

Four things, all as files in this repository, on a branch you name.

1. **`docs/decisions/<date>-p11-replan.md`** — your architectural decisions. Every item in §5
   gets a ruling. Every design in §6 gets its shape, its data model and its failure modes. Say
   what you rejected and why. This is the document Opus will be held to, so ambiguity in it
   becomes wasted work later.

2. **A revised phase plan**, as an edit to `docs/06-build-plan.md`. P10 is not finished and
   what is left of it may not be what it says. Sequence what follows, and say explicitly which
   phases can start before PDMX is on disk and which cannot.

3. **The prompt files themselves**, `prompts/P11-*.md`, `P12-*.md`, … — one per phase, in the
   house format described in §1, each naming its branch and the doc sections to read. These
   are what the owner pastes into Opus. Write them so that a competent implementer who has not
   read this brief can execute them from the repository alone. Size them so that one is a
   session's work, not a week's: P7 was too big and had to be run in seven parts, and that is
   recorded in its decision doc as a mistake.

4. **Updates to `docs/02-curriculum.md` and `docs/03-content-pipeline.md`** where your
   decisions contradict them. Do not leave a doc saying something your plan makes false.

## 8. Two things to check rather than assume

**Comprehensiveness.** Go through the curriculum, the lessons and the drills and check they
actually cover learning the piano — not that they cover what has been built. Take `docs/02`
Part D's tracks and Part F's tune list as a starting point and be sceptical of both. What
skill does a learner need at Stage 3 that nothing here teaches? Which rung would leave someone
stuck? Where is a lesson describing a skill that has no exercise, or an exercise for a skill no
lesson explains? Where does the ladder jump? Sight-reading, rhythm independence, pedalling,
transposition, playing by ear, improvising, memorising, performing for someone, practising
efficiently, dealing with a plateau — check each of those has a home. Say what is missing.
This is the item most likely to be skimmed and it is the one the owner asked for most directly.

**Whether the shape is right at all.** You are allowed to conclude that some of the above is
the wrong idea, or that something not mentioned matters more. The owner's six ideas are good
ones but they are his best guess at fixing a library that is too small and too hard. If you see
a better structure, argue for it in the decision document. What you may not do is quietly drop
one of them.

## 9. The owner's answers you can rely on

Asked and settled, so you need not ask again: the app is for him alone; he will download
datasets himself and is willing to commit a curated subset of scores into the repository; the
repository will go private and the GitHub Pages deploy is only for testing; he wants the APK;
he wants to minimise what needs to be online; he wants alternatives at every level; and the
metronome must work while sheet music is on screen.

What you may still ask, in a "Questions for the owner" section at the end of your decision
document: anything where two designs are genuinely defensible and his preference decides it.
Keep that list short and make each question answerable in a sentence.
