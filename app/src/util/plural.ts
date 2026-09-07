/**
 * "1 score", "37,261 scores" — rather than "37,261 score(s)".
 *
 * Six places in the UI wrote `(s)` and the screenshots put three of them on
 * screen at once: *This rung has 9 option(s)*, *37,261 score(s) in
 * pianopath-library*, *The app heard 84 note(s) over 4.0 minute(s)*. It is the
 * one piece of programmer's shorthand a reader is guaranteed to notice, on an
 * app whose whole voice is meant to be a person talking.
 *
 * English only, deliberately: `00` A7 is one owner reading English, and a
 * localisation table with one locale in it is not a feature.
 */

/** The count and its noun, with the count formatted for reading. */
export function plural(count: number, singular: string, pluralForm?: string): string {
  return `${count.toLocaleString()} ${nounFor(count, singular, pluralForm)}`;
}

/** Just the noun, for when the number is already on the page. */
export function nounFor(count: number, singular: string, pluralForm?: string): string {
  return count === 1 ? singular : (pluralForm ?? `${singular}s`);
}
