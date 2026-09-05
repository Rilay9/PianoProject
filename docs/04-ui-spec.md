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

- Header: streak, minutes today / goal, "Connect piano" status chip (green = MIDI input
  active, grey = none, tap → MIDI screen).
- **Session card** (auto-built from the template in curriculum Part A §8): Warm-up (1–2
  technique drills in the current keys) · Review (due items) · New (current lesson's chosen
  exercise + song) · Repertoire (a mastered piece) · Free play prompt. Each row: title, level,
  hands, est. minutes, ▶ button. Tapping ▶ opens the Score screen for that item.
- "Shuffle options" swaps the exercise/song for another option from the same lesson.
- "Start session" runs the rows in order with a between-item summary.

## 3. Plan (curriculum browser)

- Stage list (0–9) with completion rings; expand → units → lessons.
- Lesson page: concept text (markdown), videos (list of link cards opening YouTube), **Exercise
  options** and **Song options** as cards (title, composer, level, hands, duration, source
  badge, status badge new/started/passed/mastered, "Import needed" for `[IMPORT]`). Any card
  → Score screen. "Mark lesson done manually" (with confirmation) for the no-MIDI honour path.
- Track chips at the top (Classical, Chords & Pop, Blues…) with toggle "active"; ordering by
  drag.
- Placement test entry (Stage 0.4).

## 4. Library

- Search + filters: type, track, level range, hands, key, time signature, concept tag, status,
  source. Sorting by level/title/recent.
- Imports section: "Import MusicXML/MXL" (file picker; also accepts share-target intents
  when installed), list of imported items with edit (title, level, tags) and delete.
- Item detail sheet: metadata, sections, practice tips, media, "Open".

## 5. Score screen (the core)

Layout (landscape): notation fills the screen; a **thin control bar** auto-hides after 3 s
and returns on tap.

Control bar: ⏮ restart · ▶/⏸ · mode selector (Wait / Tempo / Listen / Free) · tempo % slider
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

**Practice** — default mode with MIDI [Wait], without MIDI [Tempo]; bars per window [2];
half-window scrolling [off]; layout [Window]; default tempo % for new items [70]; count-in
[1 bar]; metronome sound [wood]; wait-mode strictness [lenient: wrong notes don't block];
tempo-mode timing tolerance ms [±150]; auto-advance to next window lead [when cursor enters
last bar's last beat]; pass criteria (accuracy % [90], tempo % [80]); require 2 songs per
lesson [off]; strict prerequisites [off]; daily goal minutes [30].

**Display** — theme [system]; landscape lock on score screen [on]; zoom [1.0]; show
fingering [on]; show note names in note heads [off; auto-on for Stage ≤ 1]; show chord
symbols [on]; keyboard strip [on]; keep screen awake [on]; left-handed layout [off].

**Sound** — piano volume; metronome volume; playback plays: both / only the non-focused hand
[non-focused when hand focus set]; output device note (phone speaker / BT); "send playback
to piano over MIDI OUT" [off].

**MIDI** — input device (auto / list); transpose input semitones [0]; velocity curve
[linear]; treat Note-On velocity 0 as Note-Off [on]; sustain pedal CC [64]; ignore channels;
diagnostics: raw log, latency test (tap a key, see ms), "connected devices".

**Content** — active tracks; show US-only PD items [on]; language [en]; note naming
[letters]; reset progress (double confirm).

## 8. Empty/edge states

No MIDI: the app never nags; "Connect piano" chip stays grey; Tempo/Listen/Free modes work
fully; Wait mode uses the on-screen keyboard. Permission denied: explain how to re-enable in
Chrome site settings (Chrome ⋮ → Settings → Site settings → MIDI devices). Offline: everything
works; the video links show "needs internet". Import failure: show the parser's message and a
"Copy details" button.

## 9. Accessibility

All controls labelled; score screen has a "large cursor" option; colour choices pass WCAG AA
and correct/wrong also differ by shape (✓ / ✗ glyph on the keyboard strip) for colour-blind
users; font scaling respected outside the notation.
