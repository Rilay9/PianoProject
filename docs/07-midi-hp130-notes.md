# 07 — MIDI and the Roland HP-130: what we know, what to try (deferred)

Deliberately short. The owner asked that MIDI not consume the planning effort; the app is fully
usable without it, and Phase P1 ships a diagnostics screen that will tell us in seconds what
the cable is doing.

## What we know

- The Roland HP-130 is a 1990s digital piano with standard **5-pin DIN MIDI IN / OUT** and a
  MIDI implementation chart in its owner's manual (available on ManualsLib and similar mirrors).
  It transmits ordinary MIDI 1.0 Note On/Off with velocity and sustain CC64. There is no
  proprietary "old Roland protocol" for note data on this instrument; Roland's pre-MIDI DCB bus
  belonged to 1982–83 synthesizers only. Any modern USB-MIDI interface should read it.
- Skoove on Android supports USB MIDI via the Android MIDI service; if Skoove sees nothing,
  Android itself is not seeing a MIDI device, or the device is seen but sends nothing.
- Chrome for Android exposes Web MIDI to our app through the same Android MIDI service, with a
  permission prompt (Chrome ≥ 124).

## Most likely causes, in order (cheap "USB MIDI cable" from Amazon)

1. **Plug direction.** The cable's DIN plugs are labelled from the *computer's* point of view:
   the plug marked **IN** must go into the piano's **MIDI OUT** (data flows *into* the computer).
   Some cables are labelled the opposite way. Try both plugs in the piano's OUT.
2. **No USB host path.** The phone needs a **USB-C OTG adapter** (or a USB-C cable version);
   the S25 supports host mode. When plugged, Android should show a USB notification; the free
   **MIDI Scope** app (Google/Mobileer) lists connected MIDI devices and prints messages — use
   it before blaming any app.
3. **Faulty cable firmware.** Many no-name cables drop or corrupt messages (stuck notes,
   nothing on one direction). If MIDI Scope shows the device but no messages while pressing
   keys after step 1, the cable is the suspect. A known-good replacement is the **Roland
   UM-ONE mk2** (class-compliant, works on Android).
4. **Piano settings.** Some HPs of that era have a MIDI transmit-channel or "Local/MIDI"
   function; check the manual's MIDI section and reset to defaults (transmit channel 1). If the
   piano was ever set to a mode that sends nothing on OUT, that would explain the symptom.
5. **Cable has power LEDs?** If yes, the IN LED should blink when keys are pressed.

## Deferred checklist (owner, 10 minutes, after P1 ships)

1. Plug in; open MIDI Scope → note the device name and whether messages appear when playing.
2. Open the PianoPath Diagnostics screen → Connect → grant permission → play keys → "Copy
   debug report" → paste into the next Claude session.
3. Report: cable brand/model, plug orientation tried, OTG adapter used, what the two apps showed.

That report is all a builder needs to finish the MIDI story; everything else in the app is
independent of it.
