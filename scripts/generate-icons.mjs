/**
 * Draws the app icons, and writes them as PNGs.
 *
 * There is no image library here on purpose. The icon is five flat shapes on a
 * flat background — a rasteriser for that is shorter than the argument for
 * adding a dependency, and Node already ships the only hard part (`zlib`).
 *
 *   node scripts/generate-icons.mjs
 *
 * The output is committed. This runs when the mark changes, never in the build.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const PURPLE = [0x7b, 0x2d, 0x8e, 0xff]
const GOLD = [0xff, 0xd8, 0x4d, 0xff]
const WHITE = [0xff, 0xff, 0xff, 0xff]
const INK = [0x2b, 0x2b, 0x3d, 0xff]
const CLEAR = [0, 0, 0, 0]

/**
 * The mark, in a 64×64 design space — the same coordinates as `favicon.svg`,
 * so the two cannot drift apart without somebody noticing.
 *
 * `inset` shrinks the artwork towards the centre for maskable icons, where a
 * launcher is free to crop up to 20% off every edge.
 */
function paint(x, y, size, { rounded, inset }) {
  const u = 64 / size
  // Into design space, with the maskable inset applied about the centre.
  const dx = (x * u - 32) / inset + 32
  const dy = (y * u - 32) / inset + 32

  if (dx < 0 || dy < 0 || dx > 64 || dy > 64) return rounded ? CLEAR : PURPLE

  // Ball: a white disc with a dark five-pointed-ish star, at the foot.
  const ball = Math.hypot(dx - 32, dy - 54)
  if (ball <= 7) return ball > 6.4 || inStar(dx, dy) ? INK : WHITE

  // The bar under the crown.
  if (dx >= 12 && dx <= 52 && dy >= 42 && dy <= 48) return GOLD

  // The crown itself: the polygon from favicon.svg.
  if (inPolygon(dx, dy, CROWN)) return GOLD

  if (!rounded) return PURPLE

  // Rounded corners, for the icon that is *not* maskable and so has to carry
  // its own shape.
  const r = 14
  const cx = Math.min(Math.max(dx, r), 64 - r)
  const cy = Math.min(Math.max(dy, r), 64 - r)
  return Math.hypot(dx - cx, dy - cy) <= r ? PURPLE : CLEAR
}

const CROWN = [
  [12, 40],
  [18, 22],
  [26, 32],
  [32, 18],
  [38, 32],
  [46, 22],
  [52, 40],
]

function inStar(x, y) {
  // The little star on the ball — a diamond, which at 14px reads as a star and
  // needs no trigonometry.
  const px = Math.abs(x - 32)
  const py = Math.abs(y - 53.5)
  return px / 3.6 + py / 4 <= 1
}

function inPolygon(x, y, points) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i]
    const [xj, yj] = points[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function render(size, options) {
  // One filter byte (0 = none) per scanline, then RGBA.
  const raw = Buffer.alloc(size * (size * 4 + 1))
  let at = 0
  for (let y = 0; y < size; y += 1) {
    raw[at] = 0
    at += 1
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = paint(x + 0.5, y + 0.5, size, options)
      raw[at] = r
      raw[at + 1] = g
      raw[at + 2] = b
      raw[at + 3] = a
      at += 4
    }
  }
  return png(size, raw)
}

function png(size, raw) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function chunk(type, body) {
  const head = Buffer.alloc(8)
  head.writeUInt32BE(body.length, 0)
  head.write(type, 4, 'ascii')
  const crcOver = Buffer.concat([head.subarray(4), body])
  const tail = Buffer.alloc(4)
  tail.writeUInt32BE(crc32(crcOver), 0)
  return Buffer.concat([head, body, tail])
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const outputs = [
  // Plain icons carry their own rounded shape.
  ['icon-192.png', 192, { rounded: true, inset: 1 }],
  ['icon-512.png', 512, { rounded: true, inset: 1 }],
  // Maskable ones fill the square and keep the art inside the safe zone, because
  // the launcher decides the shape and will crop.
  ['icon-maskable-512.png', 512, { rounded: false, inset: 0.72 }],
  // iOS ignores the manifest and reads this one. It must not be transparent:
  // Safari composites it onto black, and a purple crown on black is a smudge.
  ['apple-touch-icon.png', 180, { rounded: false, inset: 0.82 }],
]

for (const [name, size, options] of outputs) {
  writeFileSync(join(PUBLIC, name), render(size, options))
  console.log(`${name}  ${size}×${size}`)
}
