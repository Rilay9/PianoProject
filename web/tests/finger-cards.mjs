// Finger-number cards (a set's `view: "fingers"`, owner 2026-10-17) against the activity that plays them: the app takes the
// numbers shown on the keys from the activity's `fingers` and the card's own numbers from the set, so the two must agree
// on every note, or the card would say 3 where the key says 2. Also: such a set is played in Drills only. Read straight
// from the files (not through the app's reader), so a mistake in either is caught. Used by check:activity (activity
// files) and check:path (activities written out in a lesson's steps).

const LETTER = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midi = (p) => { const m = /^([A-G])(#|b)?(-?\d)$/.exec(p.trim()); return m ? (Number(m[3]) + 1) * 12 + LETTER[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) : null; };
const pc = (p) => { const m = /^([A-G])(#|b)?$/.exec(p); return m ? (LETTER[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12 : null; };

/** The finger the activity's map gives a key (a key's own entry over its pitch's), or undefined. */
function mapped(fingers, m) {
  let byPc;
  for (const [k, f] of Object.entries(fingers ?? {})) { if (midi(k) === m) return f; if (pc(k) === ((m % 12) + 12) % 12) byPc = f; }
  return byPc;
}

/** What is wrong (none: []): `activity` as read (or raw), `set` the set file's JSON. */
export function fingerCardProblems(activity, set) {
  if (set?.view !== 'fingers') return [];
  const out = [];
  if (activity.screen !== 'drills') out.push(`set "${activity.set}" gives finger-number cards: Drills only`);
  const f = activity.fingers;
  if (!f) return out; // (no map: the card's own numbers are shown on its keys)
  // (as read by the app, { pc, key }; or as written in a file, { "C4": 1, "C#": 2 })
  const fingerOf = (m) => (f.pc || f.key ? f.key?.[m] ?? f.pc?.[((m % 12) + 12) % 12] : mapped(f, m));
  for (const [n, it] of Object.entries(set.items ?? {})) {
    const notes = String(it.notes ?? '').split(',').map((p) => p.trim()).filter(Boolean);
    const fingers = String(it.fingers ?? '').replace(/\//g, ' ').trim().split(/\s+/).map(Number);
    notes.forEach((p, i) => {
      const m = midi(p), want = fingerOf(m);
      if (want !== undefined && want !== fingers[i]) out.push(`card ${n}, note ${i + 1} (${p}): finger ${fingers[i]} on the card, ${want} in the activity's fingers`);
    });
  }
  return out;
}
