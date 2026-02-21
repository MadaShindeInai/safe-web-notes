#!/usr/bin/env node
/**
 * Generates public/icons/icon-192.png and public/icons/icon-512.png.
 * Uses only Node.js built-ins (zlib for deflate, fs for output).
 *
 * Icon design: indigo (#4f46e5) background, white "R" letter centered.
 */
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

// ─── CRC32 ────────────────────────────────────────────────────────────────────

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf, start = 0, end = buf.length) {
  let c = 0xffffffff
  for (let i = start; i < end; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.concat([typeBytes, data])
  const crcVal = Buffer.alloc(4)
  crcVal.writeUInt32BE(crc32(crcBuf))
  return Buffer.concat([len, typeBytes, data, crcVal])
}

// ─── Simple pixel font for "R" (17x17 bitmask, coordinates in unit grid) ─────

/**
 * Renders a capital "R" as a set of filled rectangles relative to a unit square.
 * Returns true if pixel (px, py) is inside the "R" glyph.
 * All coordinates are normalised to [0, 1].
 */
function isLetterR(px, py) {
  // Stem (left vertical bar): x in [0.20, 0.38], y in [0.15, 0.85]
  if (px >= 0.20 && px < 0.38 && py >= 0.15 && py < 0.85) return true
  // Top bowl – upper horizontal bar: x in [0.20, 0.68], y in [0.15, 0.33]
  if (px >= 0.20 && px < 0.68 && py >= 0.15 && py < 0.33) return true
  // Top bowl – right vertical bar: x in [0.56, 0.74], y in [0.15, 0.54]
  if (px >= 0.56 && px < 0.74 && py >= 0.15 && py < 0.54) return true
  // Mid bar: x in [0.20, 0.68], y in [0.46, 0.54]
  if (px >= 0.20 && px < 0.68 && py >= 0.46 && py < 0.54) return true
  // Leg – diagonal from mid-right to bottom-right
  // Leg starts at (0.56, 0.54) and ends at (0.76, 0.85)
  // We draw it as a parallelogram leaning to the right
  const legX = 0.50 + (py - 0.46) * 0.68
  if (px >= legX && px < legX + 0.18 && py >= 0.54 && py < 0.85) return true
  return false
}

function roundedCornerAlpha(nx, ny, radius) {
  // nx, ny are normalised [0,1] coords; returns 1 inside rounded rect, 0 outside
  // Compute distance from nearest corner
  const cx = nx < radius ? radius : nx > 1 - radius ? 1 - radius : nx
  const cy = ny < radius ? radius : ny > 1 - radius ? 1 - radius : ny
  const dx = nx - cx
  const dy = ny - cy
  return Math.sqrt(dx * dx + dy * dy) <= radius ? 1 : 0
}

function generatePng(size) {
  const radius = 0.22 // corner radius as fraction of size
  const pad = 0.08    // letter padding inside icon

  // Raw image data: each row starts with filter byte 0, then RGB
  const rowBytes = 1 + size * 3
  const raw = Buffer.alloc(size * rowBytes, 0)

  for (let y = 0; y < size; y++) {
    raw[y * rowBytes] = 0 // filter: None
    const ny = y / (size - 1)

    for (let x = 0; x < size; x++) {
      const nx = x / (size - 1)

      // Background: indigo #4f46e5
      let r = 0x4f, g = 0x46, b = 0xe5

      // Clip to rounded rectangle
      if (!roundedCornerAlpha(nx, ny, radius)) {
        r = 0xff; g = 0xff; b = 0xff // transparent → white for PNG (no alpha)
        // Actually make it fully transparent by outputting the same bg colour as the manifest bg (#fff)
        // We use white as the "transparent" stand-in since we have no alpha channel
      } else {
        // Check if pixel is in letter R
        const lx = (nx - pad) / (1 - 2 * pad)
        const ly = (ny - pad) / (1 - 2 * pad)
        if (lx >= 0 && lx <= 1 && ly >= 0 && ly <= 1 && isLetterR(lx, ly)) {
          r = 0xff; g = 0xff; b = 0xff
        }
      }

      const off = y * rowBytes + 1 + x * 3
      raw[off] = r
      raw[off + 1] = g
      raw[off + 2] = b
    }
  }

  const compressed = deflateSync(raw)

  // IHDR
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)   // width
  ihdrData.writeUInt32BE(size, 4)   // height
  ihdrData[8] = 8                    // bit depth
  ihdrData[9] = 2                    // colour type: RGB (no alpha)
  ihdrData[10] = 0                   // compression
  ihdrData[11] = 0                   // filter
  ihdrData[12] = 0                   // interlace

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [192, 512]) {
  const png = generatePng(size)
  const outPath = join(outDir, `icon-${size}.png`)
  writeFileSync(outPath, png)
  console.log(`Written ${outPath} (${png.length} bytes)`)
}
