// Reading compressed MusicXML (.mxl).
//
// An .mxl is a zip whose `META-INF/container.xml` names the real score file.
// The content pipeline emits .mxl (it is roughly 10× smaller than plain XML,
// which matters for a 60 MB precache budget), and the dev route accepts one
// dropped from the phone, so both need to unzip without a server. `fflate` is
// ~10 kB and synchronous, which is what a drop handler wants.

import { unzipSync, strFromU8 } from 'fflate';

const CONTAINER_PATH = 'META-INF/container.xml';

/** A file inside an .mxl that is plausibly the score itself. */
function looksLikeScore(path: string): boolean {
  const lower = path.toLowerCase();
  if (lower.startsWith('meta-inf/') || lower.startsWith('__macosx/')) return false;
  return lower.endsWith('.xml') || lower.endsWith('.musicxml');
}

/**
 * Finds the root score path from `META-INF/container.xml`.
 *
 * Parsed with a regex rather than DOMParser: this runs in Node tests too, and
 * the container format is a fixed three-line file — a full XML parse buys
 * nothing and would drag a DOM dependency into the extraction path.
 */
function rootFileFromContainer(containerXml: string): string | undefined {
  const match = /<rootfile\b[^>]*\bfull-path\s*=\s*"([^"]+)"/i.exec(containerXml);
  return match?.[1];
}

/**
 * Unzips an .mxl and returns the MusicXML text inside.
 *
 * Falls back to the first plausible .xml entry when the container is missing
 * or points at something absent — some exporters write a bare zip, and losing
 * an otherwise-readable score to a malformed manifest would be a poor trade.
 */
export function mxlToMusicXml(data: Uint8Array): string {
  const files = unzipSync(data);
  const container = files[CONTAINER_PATH];
  if (container) {
    const rootPath = rootFileFromContainer(strFromU8(container));
    const root = rootPath ? files[rootPath] : undefined;
    if (root) return strFromU8(root);
  }
  for (const [path, contents] of Object.entries(files)) {
    if (looksLikeScore(path)) return strFromU8(contents);
  }
  throw new Error('mxlToMusicXml: no MusicXML file found inside the archive');
}

/** PK\x03\x04 — the zip local-file-header magic every .mxl starts with. */
export function isMxl(data: Uint8Array): boolean {
  return data[0] === 0x50 && data[1] === 0x4b && data[2] === 0x03 && data[3] === 0x04;
}

/**
 * Accepts either flavour and returns MusicXML text. `.mxl` files are detected
 * by their zip magic, not by extension, so a mis-named file still loads.
 */
export function toMusicXml(data: Uint8Array): string {
  return isMxl(data) ? mxlToMusicXml(data) : strFromU8(data);
}
