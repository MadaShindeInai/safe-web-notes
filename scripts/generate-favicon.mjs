#!/usr/bin/env node
// Generates public/favicon.ico — a 32x32 PNG-in-ICO with a dark "R" icon.
// Uses only Node.js built-ins (zlib, fs, crypto).

import { deflateSync } from "zlib";
import { writeFileSync } from "fs";

const W = 32;
const H = 32;

// Colors: RGBA
const BG = [0xfa, 0xcc, 0x15, 0xff]; // #FACC15 yellow opaque
const FG = [0x00, 0x00, 0x00, 0xff]; // black
const TR = [0x00, 0x00, 0x00, 0x00]; // transparent

// 4×6 pixel-art glyphs (rows × cols, 1 = foreground)
const L_GLYPH = [
  [1, 0, 0, 0],
  [1, 0, 0, 0],
  [1, 0, 0, 0],
  [1, 0, 0, 0],
  [1, 0, 0, 0],
  [1, 1, 1, 1],
];

const H_GLYPH = [
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [1, 1, 1, 1],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
];

const GLYPH_COLS = 4;
const GLYPH_ROWS = 6;
const SCALE = 3; // each glyph pixel → 3×3 block
const GAP = 2; // pixels between the two glyphs

// Total letter area: 2 glyphs + gap
const LETTER_W = 2 * GLYPH_COLS * SCALE + GAP; // = 26
const LETTER_H = GLYPH_ROWS * SCALE; // = 18
const PAD_X = Math.floor((W - LETTER_W) / 2); // = 3
const PAD_Y = Math.floor((H - LETTER_H) / 2); // = 7
const RADIUS = 7; // rounded-corner radius (matches icon.tsx)

/** Returns true if (x, y) is inside a rounded rectangle 0…W×0…H with corner radius r. */
function insideRoundedRect(x, y, r) {
  const nx = Math.max(r, Math.min(W - 1 - r, x));
  const ny = Math.max(r, Math.min(H - 1 - r, y));
  return (x - nx) ** 2 + (y - ny) ** 2 <= r * r;
}

/** Returns true if (x, y) is a glyph pixel. */
function isGlyph(x, y) {
  const row = Math.floor((y - PAD_Y) / SCALE);
  if (row < 0 || row >= GLYPH_ROWS) return false;

  // L occupies x=[PAD_X, PAD_X + GLYPH_COLS*SCALE)
  const lx = x - PAD_X;
  if (lx >= 0 && lx < GLYPH_COLS * SCALE) {
    const col = Math.floor(lx / SCALE);
    return L_GLYPH[row][col] === 1;
  }

  // H occupies x=[PAD_X + GLYPH_COLS*SCALE + GAP, ...)
  const hx = x - (PAD_X + GLYPH_COLS * SCALE + GAP);
  if (hx >= 0 && hx < GLYPH_COLS * SCALE) {
    const col = Math.floor(hx / SCALE);
    return H_GLYPH[row][col] === 1;
  }

  return false;
}

// Build RGBA pixel buffer
const pixels = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const idx = (y * W + x) * 4;
    const color = !insideRoundedRect(x, y, RADIUS)
      ? TR
      : isGlyph(x, y)
        ? FG
        : BG;
    pixels[idx] = color[0];
    pixels[idx + 1] = color[1];
    pixels[idx + 2] = color[2];
    pixels[idx + 3] = color[3];
  }
}

// ── PNG encoder ────────────────────────────────────────────────────────────

// CRC32 lookup table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[i] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length, 0);
  const crcVal = Buffer.allocUnsafe(4);
  crcVal.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

function buildPNG() {
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Raw scan lines: 1 filter byte (0 = None) + W*4 bytes each row
  const raw = Buffer.allocUnsafe(H * (1 + W * 4));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 4)] = 0; // filter: None
    for (let x = 0; x < W; x++) {
      const src = (y * W + x) * 4;
      const dst = y * (1 + W * 4) + 1 + x * 4;
      raw[dst] = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }

  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── ICO wrapper ────────────────────────────────────────────────────────────

function buildICO(pngData) {
  // Header: reserved(2) + type(2) + count(2)
  const header = Buffer.allocUnsafe(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(1, 4); // 1 image

  // Directory entry (16 bytes per image)
  const entry = Buffer.allocUnsafe(16);
  entry[0] = W === 256 ? 0 : W; // 0 means 256 in ICO spec
  entry[1] = H === 256 ? 0 : H;
  entry[2] = 0; // palette size (0 = none)
  entry[3] = 0; // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngData.length, 8);
  entry.writeUInt32LE(6 + 16, 12); // offset = header + one entry

  return Buffer.concat([header, entry, pngData]);
}

const png = buildPNG();
const ico = buildICO(png);
writeFileSync(new URL("../public/favicon.ico", import.meta.url), ico);
console.log(`Generated public/favicon.ico (${ico.length} bytes)`);
