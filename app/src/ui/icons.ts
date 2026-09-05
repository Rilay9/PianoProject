// Small inline SVG icons for the tab bar. Kept intentionally simple line
// glyphs (24x24 viewBox, currentColor stroke) — no icon font per the UI spec.

function svg(paths: string): string {
  return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

export const tabIcons: Record<string, string> = {
  // Today: a sun-like "now" marker
  today: svg(
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  ),
  // Plan: a checklist / roadmap
  plan: svg(
    '<path d="M4 6h4M4 12h4M4 18h4"/><path d="M11 6h9M11 12h9M11 18h9"/><circle cx="6" cy="6" r="0.4"/>',
  ),
  // Library: stacked books
  library: svg(
    '<path d="M4 19V5a1 1 0 0 1 1-1h3v16"/><path d="M10 4h9a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-9"/>',
  ),
  // Progress: a rising bar chart
  progress: svg('<path d="M4 20V10M10 20V4M16 20v-7M20 20V13"/>'),
  // Settings: a gear
  settings: svg(
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 12a7.4 7.4 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L14.8 3h-3.6l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 1.7 1l.4 2.6h3.6l.4-2.6a7.6 7.6 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.07-.33.1-.66.1-1Z"/>',
  ),
};
