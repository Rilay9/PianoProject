// Adding files to the library (owner, 2026-10-13): MusicXML and MXL (compressed MusicXML), PDF, and MIDI (converted
// on the phone). Each file is recognised by its contents, not its name; what cannot be added is said in one sentence.
// The file is kept as it came (an MXL stays an MXL, so Export gives back what you added).

import JSZip from 'jszip';
import { readScore, type ReadScore } from './facts';
import { sha256, type Own } from './store';

// (application/octet-stream and zip too: Android often labels an .mxl so, and would grey it out otherwise.)
export const ACCEPT = '.musicxml,.xml,.mxl,.pdf,.mid,.midi,application/vnd.recordare.musicxml+xml,application/vnd.recordare.musicxml,application/pdf,audio/midi,audio/x-midi,application/zip,application/octet-stream';
const MAX_BYTES = 64 * 1024 * 1024; // a PDF
const MAX_SCORE_BYTES = 16 * 1024 * 1024; // MusicXML as text: far more than the score screen can draw comfortably

const startsWith = (b: Uint8Array, s: string) => [...s].every((c, i) => b[i] === c.charCodeAt(0));
type Sort = 'musicxml' | 'mxl' | 'pdf' | 'midi' | null;
function sortOf(b: Uint8Array): Sort {
  if (startsWith(b, '%PDF-')) return 'pdf';
  if (startsWith(b, 'PK')) return 'mxl';
  if (startsWith(b, 'MThd')) return 'midi';
  // Text that starts with XML (after a byte-order mark and spaces).
  const head = decodeText(b.slice(0, 512)).replace(/^\uFEFF/, '').trimStart();
  return head.startsWith('<') ? 'musicxml' : null;
}
/** Text in UTF-8, or UTF-16 when it starts with that byte-order mark (some programs save MusicXML so). */
function decodeText(b: Uint8Array): string {
  const enc = b[0] === 0xff && b[1] === 0xfe ? 'utf-16le' : b[0] === 0xfe && b[1] === 0xff ? 'utf-16be' : 'utf-8';
  return new TextDecoder(enc).decode(b);
}

/** The MusicXML inside an MXL: the file its container names (else the first score in it). */
export async function unzipMxl(data: ArrayBuffer | Blob): Promise<string> {
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(data); } catch { throw new Error('This compressed file could not be opened.'); }
  const container = await zip.file('META-INF/container.xml')?.async('string');
  const named = container?.match(/full-path="([^"]+)"/)?.[1];
  const entry = (named && zip.file(named)) || zip.file(/^(?!META-INF\/).*\.(musicxml|xml)$/i)[0];
  if (!entry) throw new Error('This compressed file has no MusicXML score in it.');
  return entry.async('string');
}

/** The MusicXML text of a file you added (an MXL unzipped). */
export async function xmlOfFile(blob: Blob): Promise<string> {
  const b = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  return startsWith(b, 'PK') ? unzipMxl(blob) : decodeText(new Uint8Array(await blob.arrayBuffer()));
}

/** original: a MIDI file's own bytes, kept beside the MusicXML made from it (so it can be converted again later). */
export interface Prepared { id: string; own: Own; blob: Blob; read?: ReadScore; original?: Blob }
export type Converter = (data: ArrayBuffer, name: string) => Promise<{ xml: string; guessed: string }>;

/** Reads one file into what the library keeps; throws a one-sentence reason when it cannot. */
export async function prepare(file: File, midi?: Converter): Promise<Prepared> {
  if (file.size > MAX_BYTES) throw new Error(`This file is ${Math.round(file.size / 1048576)} MB; the most is ${MAX_BYTES / 1048576} MB.`);
  const data = await file.arrayBuffer();
  const bytes = new Uint8Array(data);
  const sort = sortOf(bytes);
  if (!sort) throw new Error('Not a score: the library takes MusicXML, MXL, MIDI and PDF.');
  const hash = await sha256(data);
  const id = `u-${hash.slice(0, 12)}`;
  const base = { origin: 'yours' as const, added: new Date().toISOString(), hash, file: { name: file.name, size: file.size, type: file.type } };
  if (sort === 'pdf') {
    const title = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim() || 'Untitled';
    return { id, blob: file, own: { ...base, kind: 'pdf', title, composer: '', facts: null } };
  }
  if (sort === 'midi') {
    if (!midi) throw new Error('MIDI files cannot be added here.');
    const { xml, guessed } = await midi(data, file.name);
    const read = readScore(xml, file.name);
    const blob = new Blob([xml], { type: 'application/vnd.recordare.musicxml+xml' });
    const name = file.name.replace(/\.midi?$/i, '') + '.musicxml';
    return { id, blob, read, original: file, own: { ...base, file: { name, size: blob.size, type: blob.type }, kind: read.facts.kind, title: read.title, composer: read.composer, facts: read.facts, converted: guessed, midi: { name: file.name, size: file.size } } };
  }
  const xml = sort === 'mxl' ? await unzipMxl(data) : decodeText(bytes);
  if (xml.length > MAX_SCORE_BYTES) throw new Error(`This score is ${Math.round(xml.length / 1048576)} MB of MusicXML; the most the app takes is ${MAX_SCORE_BYTES / 1048576} MB.`);
  const read = readScore(xml, file.name);
  return { id, blob: file, read, own: { ...base, kind: read.facts.kind, title: read.title, composer: read.composer, facts: read.facts } };
}
