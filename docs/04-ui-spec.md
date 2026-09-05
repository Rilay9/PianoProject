# 04 — UI specification

Phone-first (Galaxy S25, 6.2", 2340×1080, ~412×915 CSS px portrait / 915×412 landscape).
Every screen must be usable one-handed in portrait except the **Score screen**, which is
designed for landscape on a music stand and touched rarely.

Design language: high contrast, large tap targets (≥ 48 px), dark and light themes (system
default), no decorative animation on the score screen (rendering budget). Typography: system
font; notation is SVG from OSMD. Icons: inline SVG (no icon font).

## 1. Navigation

Bottom tab bar (portrait) / left rail (landscape): **Today · Plan · Library · Progress · Settings**.
Score screen is a full-screen route pushed on top (back gesture returns).

## 2. Today

- Header: minutes this week / weekly goal (no daily-streak guilt), days practised this week,
  **input chip** showing the active follow input (MIDI 🎹 / Mic 🎤 / Timed ⏱ / Manual) —
  tap → Input screen.
- **Session length picker:** 15 · 30 · 60 · 120 min (remembers weekday vs weekend choice).
  Short sessions = technique + review + one new item; long sessions = full template plus a
  repertoire block and, if the jam module is active, a jam block (chord-chart practice).
- **Jump to…** button: opens any stage/unit/lesson directly; and **Review a skill**: opens the
  Skills review screen (§3a).
- **Session card** (auto-built from the template in curriculum Part A §8): Warm-up (1–2
  technique drills in the current keys) · Review (due items) · New (current lesson's chosen
  exercise + song) · Repertoire (a mastered piece) · Free play prompt. Each row: title, level,
  hands, est. minutes, ▶ button. Tapping ▶ opens the Score screen for that item.
- "Shuffle options" swaps the exercise/song for another option from the same lesson.
- "Start session" runs the rows in order with a between-item summary.

## 3. Plan (curriculum browser)

- Stage list (0–9) with completion rings; expand → units → lessons.
- Every lesson is openable regardless of status. Lesson page has **"I already know this"**
  (marks self-passed; distinct badge from a measured pass) and **"Quick check"** (a 2–3 minute
  measured test built from the lesson's drills) so the owner can move on fast or confirm.
- Lesson page: concept text (markdown), videos (list of link cards opening YouTube), **Exercise
  options** and **Song options** as cards (title, composer, level, hands, duration, source
  badge, status badge new/started/passed/mastered, "Import needed" for `[IMPORT]`). Any card
  → Score screen. "Mark lesson done manually" (with confirmation) for the no-MIDI honour path.
- Track chips at the top (Classical, Chords & Pop, Blues…) with toggle "active"; ordering by
  drag.
- Placement test entry (Stage 0.4).

### 3a. Skills review

A grid of every concept in the curriculum (from `concepts[]` across lessons), each with its
state (never / self-passed / measured / mastered / rusty = not practised in 30 days) and a
"Drill it" button that launches the concept's drill or a matching short exercise. Filters by
stage and track. This is how "go back and practise old skills" works without navigating the
plan.

### 3b. Chord-chart view (jam module)

A lead-sheet view with big chord symbols per bar, a form tracker (bar/chorus counter), tempo,
count-off, optional backing loop, and swing toggle — used for jamming practice when notation is
not the point. Any item with `<harmony>` data can open in this view; the input chip still
works (mic/MIDI can highlight the chord you actually play vs the chart, amber if different).

## 4. Library

- Search + filters: type, track, level range, hands, key, time signature, concept tag, status,
  source. Sorting by level/title/recent.
- Imports section: "Import MusicXML/MXL" (file picker; also accepts share-target intents
  when installed), list of imported items with edit (title, level, tags) and delete.
- Item detail sheet: metadata, sections, practice tips, media, "Open".

## 5. Score screen (the core)

Layout (landscape): notation fills the screen; a **thin control bar** auto-hides after 3 s
and returns on tap.

Control bar: ⏮ restart · ▶/⏸ · **input selector (MIDI / Mic / Screen keys / None)** ·
mode selector (Wait / Tempo / Listen / Free) · tempo % slider
(30–130 %) with tap-to-type bpm · hands (R / L / Both) · loop (set A/B by tapping bars, or
pick a named section) · metronome on/off · count-in on/off · bars-per-window stepper (1–8) ·
zoom ± · layout (Window / Scroll) · ⋯ menu (transpose ±, show fingering, show note names,
show chord symbols, keyboard strip on/off, diagnostics).

Notation area:
- **Window layout:** exactly N bars of the grand staff, scaled to fit width (landscape) or
  height (portrait). The window advances when the cursor leaves the last bar (or, setting
  "half-window scrolling": when it reaches bar N/2+1, the next N/2 bars slide in so the
  learner always sees ahead). Pre-rendered next window ⇒ no flicker.
- **Scroll layout:** full piece, auto-scroll keeps the cursor between 25–40 % of viewport
  height; manual scroll pauses auto-scroll for 5 s.
- **Cursor:** translucent vertical band over the current step's notes spanning both staves.
- **Note colouring:** upcoming = default black; current step = blue outline; correct = green;
  wrong/missed = red; extra notes played that are not in the score are shown on the keyboard
  strip in red, not on the score. Non-focused hand dims to 35 % opacity.
- **Keyboard strip** (optional, bottom 12 % of height): 88-key mini keyboard, expected keys
  highlighted blue, pressed keys green/red; scrolls to keep expected keys visible. This is the
  no-MIDI learner's main feedback and also the ScreenKeyboardSource input surface (tap to play
  — enabled only in Free/Wait mode when no MIDI input is present).
- **Follow options on a phone** (the owner asked for several): (1) Wait mode with MIDI;
  (2) Wait mode with the microphone; (3) Tempo mode (timed to the song), with or without
  MIDI/mic judging; (4) Manual scroll layout with tap-to-advance (tap right half = next window,
  left half = previous) for playing from paper-like pages. All four use the same window/scroll
  layouts and bars-per-window setting.
- **Mic feedback colours:** correct = green, probable wrong = amber (mic can't be certain),
  missed = grey outline; a small mic-level meter sits in the control bar with a red "clipping"
  or "too quiet" hint.
- **Mode behaviours** are in `05-score-follow-engine.md`.
- End-of-run summary sheet: accuracy, timing (early/late histogram), tempo achieved, wrong-note
  hot spots (bars), pass/master badge, buttons "Again", "Slower (−10 %)", "Faster (+10 %)",
  "Loop the weak bars", "Done". Without MIDI: "How did it go?" (Rough / OK / Clean) self-report.

Gestures: single tap toggles control bar; double-tap a bar sets loop start/end; long-press a
bar plays it (Listen) ; pinch = zoom; two-finger tap = toggle hands focus.

## 6. Progress

- Calendar heat-map of practice minutes; streak; weekly minutes vs goal.
- Per-stage completion; per-track completion.
- Repertoire list (mastered) with "last played" and a replay button.
- Session history (table) with per-session detail (accuracy over time chart for an item).
- Export / Import all data (JSON). "Copy debug report".

## 7. Settings (all persisted; defaults in brackets)

**Practice** — session lengths (weekday default [30], weekend default [60]); weekly goal
minutes [150]; default mode with MIDI or mic [Wait], without [Tempo]; bars per window [2];
half-window scrolling [off]; layout [Window]; default tempo % for new items [70]; count-in
[1 bar]; metronome sound [wood]; wait-mode strictness [lenient: wrong notes don't block];
tempo-mode timing tolerance ms [±150]; auto-advance to next window lead [when cursor enters
last bar's last beat]; pass criteria (accuracy % [90], tempo % [80]); require 2 songs per
lesson [off]; strict prerequisites [off]; daily goal minutes [30].

**Display** — theme [system]; landscape lock on score screen [on]; zoom [1.0]; show
fingering [on]; show note names in note heads [off; auto-on for Stage ≤ 1]; show chord
symbols [on]; keyboard strip [on]; keep screen awake [on]; left-handed layout [off].

**Sound** — piano volume; metronome volume; playback plays: both / only the non-focused hand
[non-focused when hand focus set]; **playback destination: phone / piano over MIDI OUT /
both** [phone; auto-suggest "piano" when a MIDI output exists and mic input is active].

**Input** — follow input priority [MIDI → Mic → Timed]; **Microphone:** device (built-in /
USB interface / headset), calibration (run / re-run, shows latency and noise floor), chord
leniency [70 %], strict mic scoring [off], mute playback of expected notes while mic is active
[on]; **MIDI** — input device (auto / list); transpose input semitones [0]; velocity curve
[linear]; treat Note-On velocity 0 as Note-Off [on]; sustain pedal CC [64]; ignore channels;
diagnostics: raw log, latency test (tap a key, see ms), "connected devices".

**Content** — active tracks; show US-only PD items [on]; language [en]; note naming
[letters]; reset progress (double confirm).

## 7a. Tablet layout

Breakpoint ≥ 900 CSS px shortest side: bars-per-window default 4; a side panel (collapsible)
shows the lesson text, the chord chart, or the keyboard strip enlarged; Plan/Library become
two-column. Everything else identical.

## 8. Empty/edge states

Mic permission denied: explain Chrome site settings; fall back to Timed. Mic too noisy (noise
floor above threshold): suggest the USB audio interface path or headphones for playback.
No MIDI: the app never nags; "Connect piano" chip stays grey; Tempo/Listen/Free modes work
fully; Wait mode uses the on-screen keyboard. Permission denied: explain how to re-enable in
Chrome site settings (Chrome ⋮ → Settings → Site settings → MIDI devices). Offline: everything
works; the video links show "needs internet". Import failure: show the parser's message and a
"Copy details" button.

## 9. Accessibility

All controls labelled; score screen has a "large cursor" option; colour choices pass WCAG AA
and correct/wrong also differ by shape (✓ / ✗ glyph on the keyboard strip) for colour-blind
users; font scaling respected outside the notation.
