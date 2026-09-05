# 07 — MIDI and the Roland HP-130: resolved

**Status: working, confirmed on hardware 2026-09-05.** The owner's cable had the two 5-pin DIN
plugs reversed (see cause #1 below) — once corrected, Chrome's Web MIDI API on the Galaxy S25
sees the HP-130 cleanly through the same "USB MIDI Interface" cable that didn't work in Skoove,
and PianoPath's parser handles every message it sends correctly. This file is kept as a
reference for `WebMidiSource`'s behaviour and for anyone who later swaps cables/devices.

## Confirmed device behaviour (from a real debug report, not assumption)

- Reports to Chrome as **`USB MIDI Interface`** on both input and output ports (a second output
  port named `Scope` also appears — likely virtual/software, ignore it; `WebMidiSource` already
  listens to every input regardless of name per `01-architecture.md` §4.3, so this needed no
  special handling).
- Sends **Note On with velocity 0 in place of a separate Note Off** — confirmed in the debug
  report's parsed output (`noteOnZeroVelocity`). No real Note Off (`0x8n`) messages were observed
  in this sample; the parser must keep treating both forms as equivalent (already implemented).
- Streams **MIDI Clock (`0xF8`) and Active Sensing (`0xFE`) continuously** at a high rate (over
  1000 clock messages and ~120 active-sensing messages in a ~20-second sample). `WebMidiSource`
  already drops these from the logged/parsed stream per `05-score-follow-engine.md` §9 ("do not
  log them at full rate") — confirmed correct in practice, not just in theory.
- No stuck notes, no dropped or corrupted messages, no duplicate/out-of-order events across an
  86-message real-playing sample with normal inter-note timing (150–300 ms apart). The cable
  itself is fine once plugged the right way round.
- **Not yet tested:** the sustain pedal (CC64). Worth a quick check whenever convenient — hold
  the pedal while playing a phrase and confirm the Diagnostics raw log shows `0xBn 64 ...`
  messages — but nothing in the engine depends on this being resolved before P2/P3 proceed.

## Root cause and fix (for the record)

**Plug direction.** The cable's DIN plugs are labelled from the *computer's* point of view: the
plug marked **IN** must go into the piano's **MIDI OUT** (data flows *into* the computer). This
specific cable had them the other way round. Swapping which plug went into the piano's OUT port
fixed it immediately — no OTG adapter change, no cable replacement, no piano setting changed.

## What this means for later phases

- P1's `WebMidiSource`, `parseMidiMessage`, and the Diagnostics/MIDI screens are validated end
  to end on the owner's actual hardware, not just against the mocked fixture. No changes needed.
- P2/P3 (score rendering, practice engine) can assume Wait mode will have a working MIDI input
  on this setup from day one; the fallback modes (Tempo/mic/manual) remain equally necessary for
  portability (a different cable, a different phone) but are no longer the *primary* path here.
- If MIDI ever stops working again on this same phone/cable/piano combination, suspect a moved
  cable orientation or a new OTG adapter first — not a code regression — and re-run the same
  checklist (MIDI Scope, then PianoPath's Diagnostics "Copy debug report").

## Background reference (kept for other devices/cables)

- The Roland HP-130 is a 1990s digital piano with standard 5-pin DIN MIDI IN/OUT and a MIDI
  implementation chart in its owner's manual (ManualsLib and similar mirrors). There is no
  proprietary "old Roland protocol" involved; Roland's pre-MIDI DCB bus belonged to 1982–83
  synthesizers only.
- Other possible causes, in order, if a *different* cable or setup ever fails the same way:
  no USB host path (needs a USB-C OTG adapter; Android shows a USB notification when it works;
  the free **MIDI Scope** app confirms device-level connectivity independent of any app), faulty
  cable firmware (dropped/corrupted messages — a known-good replacement is the **Roland UM-ONE
  mk2**), or a piano-side MIDI transmit-channel/Local setting reset away from defaults.
