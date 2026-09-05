// Generates the PWA icons as plain PNGs with zero native/npm dependencies:
// a Node script that lays out pixels in a buffer and writes a PNG using only
// `node:zlib` (built in) for the DEFLATE compression PNG requires. This
// avoids `sharp`/`canvas`, which need native binaries that may not have
// prebuilt binaries for every CI/sandbox environment.
//
// Motif: a rounded-square "piano key" tile — a dark (or accent) background
// with a row of white keys and black key caps, simple enough to read at
// 192px and 512px, plus a maskable variant with extra padding.

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

/** @typedef {[number, number, number, number]} RGBA */

function crc32(buf) {
  let c;
  const table = crc32.table ?? (crc32.table = makeCrcTable());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    crc = (crc >>> 8) ^ table[c];
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** Encodes an RGBA pixel buffer (size*size*4 bytes) as a PNG file buffer. */
function encodePng(size, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Raw scanlines, each prefixed with filter byte 0 (None).
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idatData = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function setPixel(rgba, size, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  rgba[i] = r;
  rgba[i + 1] = g;
  rgba[i + 2] = b;
  rgba[i + 3] = a;
}

function fillRoundedRect(rgba, size, x0, y0, x1, y1, radius, color) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const dx = x < x0 + radius ? x0 + radius - x : x >= x1 - radius ? x - (x1 - radius) + 1 : 0;
      const dy = y < y0 + radius ? y0 + radius - y : y >= y1 - radius ? y - (y1 - radius) + 1 : 0;
      if (dx > 0 && dy > 0 && dx * dx + dy * dy > radius * radius) continue;
      setPixel(rgba, size, x, y, color);
    }
  }
}

/**
 * Draws the piano-key motif into a size x size canvas.
 * @param {number} size
 * @param {{padding: number}} opts padding as a fraction of size (for maskable icons)
 */
function drawIcon(size, { padding }) {
  const rgba = Buffer.alloc(size * size * 4);
  const bg = [15, 17, 21, 255]; // matches --bg dark theme
  const accent = [47, 111, 237, 255]; // matches --accent
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = bg[0];
    rgba[i + 1] = bg[1];
    rgba[i + 2] = bg[2];
    rgba[i + 3] = 255;
  }

  const pad = Math.round(size * padding);
  const inner = size - pad * 2;
  const cornerRadius = Math.round(size * 0.18);
  fillRoundedRect(rgba, size, pad, pad, size - pad, size - pad, cornerRadius, [24, 27, 32, 255]);

  // Keyboard block: white keys as a row, black keys as shorter overlays.
  const keyAreaTop = pad + Math.round(inner * 0.28);
  const keyAreaBottom = size - pad - Math.round(inner * 0.14);
  const keyAreaLeft = pad + Math.round(inner * 0.1);
  const keyAreaRight = size - pad - Math.round(inner * 0.1);
  const whiteKeyCount = 7;
  const keyWidth = (keyAreaRight - keyAreaLeft) / whiteKeyCount;

  fillRoundedRect(
    rgba,
    size,
    keyAreaLeft,
    keyAreaTop,
    keyAreaRight,
    keyAreaBottom,
    Math.round(keyWidth * 0.15),
    [240, 241, 245, 255],
  );

  for (let k = 1; k < whiteKeyCount; k++) {
    const x = Math.round(keyAreaLeft + k * keyWidth);
    for (let y = keyAreaTop; y < keyAreaBottom; y++) {
      setPixel(rgba, size, x, y, [200, 202, 210, 255]);
    }
  }

  const blackKeyHeight = Math.round((keyAreaBottom - keyAreaTop) * 0.6);
  const blackKeyWidth = keyWidth * 0.55;
  const blackKeyOffsets = [0, 1, 3, 4, 5]; // skip the two "no black key" gaps (E-F, B-C)
  for (const offset of blackKeyOffsets) {
    const centerX = keyAreaLeft + (offset + 1) * keyWidth;
    fillRoundedRect(
      rgba,
      size,
      Math.round(centerX - blackKeyWidth / 2),
      keyAreaTop,
      Math.round(centerX + blackKeyWidth / 2),
      keyAreaTop + blackKeyHeight,
      Math.round(blackKeyWidth * 0.2),
      [14, 15, 18, 255],
    );
  }

  // Accent bar under the keyboard (a little brand mark, doubles as a "cursor").
  const barTop = keyAreaBottom + Math.round(inner * 0.06);
  const barHeight = Math.round(inner * 0.05);
  fillRoundedRect(
    rgba,
    size,
    keyAreaLeft,
    barTop,
    keyAreaRight,
    barTop + barHeight,
    Math.round(barHeight / 2),
    accent,
  );

  return rgba;
}

const targets = [
  { name: 'icon-192.png', size: 192, padding: 0.06 },
  { name: 'icon-512.png', size: 512, padding: 0.06 },
  // Maskable icons need extra safe-area padding (~20%) since the OS may crop
  // to a circle/squircle.
  { name: 'icon-maskable-192.png', size: 192, padding: 0.18 },
  { name: 'icon-maskable-512.png', size: 512, padding: 0.18 },
];

for (const t of targets) {
  const rgba = drawIcon(t.size, { padding: t.padding });
  const png = encodePng(t.size, rgba);
  writeFileSync(join(outDir, t.name), png);
  console.log(`wrote ${t.name} (${png.length} bytes)`);
}
