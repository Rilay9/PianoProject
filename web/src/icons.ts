// The app's icons (owner, 2026-10-15: "one consistent line-icon set"): simple outline drawings on a 24-unit grid,
// drawn into the page as inline SVG (no icon library, nothing downloaded), each with one meaning wherever it appears:
// the tabs and rail, Practice, Settings, Home's recent rows. Stroke in the text's colour (currentColor).

const PATHS = {
  home: '<path d="M3 11 12 3l9 8"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  practice: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M8 4v10M12 4v16M16 4v10"/><path d="M7 4h2v10H7zM15 4h2v10h-2z"/>',
  path: '<path d="M6 21c0-5 12-4 12-9S9 8 9 5"/><path d="M9 5V2l5 1.5L9 5"/>',
  settings: '<path d="M18.75 9.51 L21.28 9.96 L21.28 14.04 L18.75 14.49 L18.54 15.01 L20.00 17.12 L17.12 20.00 L15.01 18.54 L14.49 18.75 L14.04 21.28 L9.96 21.28 L9.51 18.75 L8.99 18.54 L6.88 20.00 L4.00 17.12 L5.46 15.01 L5.25 14.49 L2.72 14.04 L2.72 9.96 L5.25 9.51 L5.46 8.99 L4.00 6.88 L6.88 4.00 L8.99 5.46 L9.51 5.25 L9.96 2.72 L14.04 2.72 L14.49 5.25 L15.01 5.46 L17.12 4.00 L20.00 6.88 L18.54 8.99Z"/><circle cx="12" cy="12" r="3"/>',
  exercises: '<path d="M3 7h18M3 11h18M3 15h18"/><circle cx="9" cy="15" r="2.2"/><path d="M11.2 15V6"/>',
  drills: '<rect x="3" y="7" width="13" height="14" rx="1.5"/><path d="M7 3h12.5A1.5 1.5 0 0 1 21 4.5V17"/>',
  simon: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>',
  lab: '<ellipse cx="12" cy="7" rx="8" ry="3"/><path d="M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7"/><path d="M8 3.5 11 7M16 3.5 13 7"/>',
  freeplay: '<path d="M3 12h3l2-6 3 12 3-9 2 3h5"/>',
  metronome: '<path d="M8.5 21 11 3h2l2.5 18z"/><path d="M12 16l5-8"/><path d="M7 17h10"/>',
  lookup: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M8 7h7M8 11h7"/>',
  document: '<path d="M6 2.5h8l4 4V21.5H6z"/><path d="M14 2.5v4h4"/><path d="M9 12h6M9 16h6"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  look: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>',
  data: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13"/><path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>',
} as const;
export type IconName = keyof typeof PATHS;

/** An icon as an element (decorative: hidden from screen readers; the words beside it name the thing). */
export function icon(name: IconName, cls = 'ic-svg'): SVGSVGElement {
  const t = document.createElement('template');
  t.innerHTML = `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${PATHS[name]}</svg>`; // (fixed strings above: no content in them)
  return t.content.firstElementChild as SVGSVGElement;
}
