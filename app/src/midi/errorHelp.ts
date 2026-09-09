/**
 * Recovery text per MIDI failure mode; the codes come from WebMidiSource.
 *
 * Shared by the MIDI screen and the setup tour, so the two say the same thing
 * about the same prompt.
 */
export const MIDI_ERROR_HELP: Record<string, string> = {
  unsupported:
    'This browser does not implement the Web MIDI API. Chrome (or Samsung Internet) ' +
    'on Android, or Chrome/Edge on a desktop, do. Everything else in PianoPath works ' +
    'without MIDI — the on-screen keyboard is a full input.',
  'permission-denied':
    'Chrome remembers a dismissed MIDI prompt. To re-enable it: Chrome ⋮ menu → ' +
    'Settings → Site settings → MIDI devices → find this site → Allow. Then come ' +
    'back and tap Connect piano again.',
  failed:
    'MIDI access failed for a reason the browser did not explain. Check that the USB ' +
    'adapter is seated, then try again. The Diagnostics screen shows the raw details.',
};
