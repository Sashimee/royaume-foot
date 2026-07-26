import * as THREE from 'three'
import type { BallSkin } from '../data/roster'

/**
 * Every texture in the game is drawn with the 2D canvas API at startup. That
 * keeps the build to text assets only — nothing to download, nothing to cache,
 * and re-skinning a ball is a few lines of drawing code instead of a PNG.
 *
 * Results are memoised: these run once and are reused by every material.
 */
const cache = new Map<string, THREE.Texture>()

function draw(key: string, w: number, h: number, paint: (c: CanvasRenderingContext2D) => void): THREE.Texture {
  const hit = cache.get(key)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const c = canvas.getContext('2d')!
  paint(c)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  cache.set(key, tex)
  return tex
}

/**
 * Mown stripes, running across the pitch so they read as distance.
 *
 * The cache key includes the colours: stadiums differ only by palette, and a
 * key of just "grass" would hand the beach the prairie's texture.
 */
export function grassTexture(light: string, dark: string): THREE.Texture {
  const tex = draw(`grass:${light}:${dark}`, 64, 256, (c) => {
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 === 0 ? light : dark
      c.fillRect(0, i * 32, 64, 32)
    }
  })
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 6)
  return tex
}

/** Goal netting: transparent with a soft white mesh. */
export function netTexture(): THREE.Texture {
  const tex = draw('net', 128, 128, (c) => {
    c.clearRect(0, 0, 128, 128)
    c.strokeStyle = 'rgba(255,255,255,0.55)'
    c.lineWidth = 2
    for (let i = 0; i <= 128; i += 16) {
      c.beginPath()
      c.moveTo(i, 0)
      c.lineTo(i, 128)
      c.moveTo(0, i)
      c.lineTo(128, i)
      c.stroke()
    }
  })
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(10, 4)
  return tex
}

export function ballTexture(skin: BallSkin): THREE.Texture {
  // 512 rather than 256: the ball fills a good part of a phone screen when it
  // sits at the penalty spot, and the old size showed its pixels there.
  return draw(`ball:${skin.id}`, 512, 512, (c) => {
    c.fillStyle = skin.base
    c.fillRect(0, 0, 512, 512)
    c.fillStyle = skin.accent
    c.strokeStyle = skin.accent
    c.lineJoin = 'round'

    // Motifs stay in the middle band: the texture is wrapped on a sphere, so
    // anything near the top or bottom edge is squeezed into a smear at a pole.
    switch (skin.pattern) {
      case 'classic':
        for (const [x, y] of [
          [80, 150], [250, 100], [400, 190], [160, 320], [360, 380], [60, 420],
        ]) {
          polygon(c, x, y, 52, 5)
        }
        break

      case 'hearts':
        scatter(14, (x, y, s) => {
          c.fillStyle = s > 22 ? skin.accent : '#ffb3d9'
          heart(c, x, y, s)
        })
        break

      case 'flowers':
        scatter(11, (x, y, s) => {
          for (let p = 0; p < 5; p++) {
            const a = (p / 5) * Math.PI * 2
            c.fillStyle = skin.accent
            circle(c, x + Math.cos(a) * s * 0.8, y + Math.sin(a) * s * 0.8, s * 0.55)
          }
          c.fillStyle = '#ffd84d'
          circle(c, x, y, s * 0.45)
        })
        break

      case 'stars':
        scatter(16, (x, y, s) => {
          c.fillStyle = s > 22 ? '#fff3b0' : skin.accent
          star(c, x, y, s * 1.3, 5)
        })
        break

      case 'bubbles':
        scatter(15, (x, y, s) => {
          c.fillStyle = skin.accent
          c.globalAlpha = 0.55
          circle(c, x, y, s * 1.4)
          c.globalAlpha = 1
          c.fillStyle = '#ffffff'
          circle(c, x - s * 0.45, y - s * 0.45, s * 0.35)
        })
        break

      case 'rainbow': {
        const bands = ['#ff6b8b', '#ffab5c', '#ffe066', '#7ed67e', '#7bd3ff', '#c07bff']
        c.lineWidth = 30
        bands.forEach((colour, i) => {
          c.strokeStyle = colour
          c.beginPath()
          c.arc(256, 620, 400 - i * 32, Math.PI * 1.12, Math.PI * 1.88)
          c.stroke()
        })
        break
      }

      case 'unicorn':
        scatter(13, (x, y, s) => {
          c.fillStyle = ['#c07bff', '#ff8ad1', '#7bd3ff'][Math.floor(s) % 3]
          sparkle(c, x, y, s * 1.5)
        })
        break

      case 'melon':
        // Rind at the poles, flesh across the middle, pips scattered on it.
        c.fillStyle = skin.accent
        c.fillRect(0, 0, 512, 96)
        c.fillRect(0, 416, 512, 96)
        c.fillStyle = '#f6f3d8'
        c.fillRect(0, 96, 512, 22)
        c.fillRect(0, 394, 512, 22)
        scatter(18, (x, y, s) => {
          if (y < 140 || y > 380) return
          c.fillStyle = '#3a2a1c'
          c.beginPath()
          c.ellipse(x, y, s * 0.32, s * 0.5, 0.4, 0, Math.PI * 2)
          c.fill()
        })
        break

      case 'galaxy':
        scatter(26, (x, y, s) => {
          c.fillStyle = s > 24 ? '#ffffff' : skin.accent
          star(c, x, y, s * 0.7, 4)
        })
        c.globalAlpha = 0.35
        c.fillStyle = '#7c5cff'
        circle(c, 180, 250, 90)
        c.fillStyle = '#ff8ad1'
        circle(c, 350, 300, 60)
        c.globalAlpha = 1
        break

      case 'cake':
        // Icing drip across the top, sprinkles below.
        c.fillStyle = skin.accent
        c.beginPath()
        c.moveTo(0, 0)
        c.lineTo(512, 0)
        c.lineTo(512, 170)
        for (let x = 512; x >= 0; x -= 64) {
          c.quadraticCurveTo(x - 32, 220, x - 64, 170)
        }
        c.closePath()
        c.fill()
        scatter(22, (x, y, s) => {
          if (y < 230) return
          c.fillStyle = ['#ff6b8b', '#ffd84d', '#7ed67e', '#7bd3ff'][Math.floor(s) % 4]
          c.save()
          c.translate(x, y)
          c.rotate(s)
          c.fillRect(-s * 0.6, -s * 0.18, s * 1.2, s * 0.36)
          c.restore()
        })
        break
    }
  })
}

function circle(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.fill()
}

/** A four-pointed twinkle, the shape everyone reads as "sparkle". */
function sparkle(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.beginPath()
  c.moveTo(x, y - s)
  c.quadraticCurveTo(x + s * 0.18, y - s * 0.18, x + s, y)
  c.quadraticCurveTo(x + s * 0.18, y + s * 0.18, x, y + s)
  c.quadraticCurveTo(x - s * 0.18, y + s * 0.18, x - s, y)
  c.quadraticCurveTo(x - s * 0.18, y - s * 0.18, x, y - s)
  c.closePath()
  c.fill()
}

function scatter(count: number, paint: (x: number, y: number, s: number) => void) {
  // A fixed pseudo-random walk: deterministic, so the same skin always looks
  // the same across reloads and across devices.
  let seed = 7
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  for (let i = 0; i < count; i++) paint(rand() * 452 + 30, rand() * 452 + 30, 16 + rand() * 14)
}

function polygon(c: CanvasRenderingContext2D, x: number, y: number, r: number, sides: number) {
  c.beginPath()
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    i === 0 ? c.moveTo(px, py) : c.lineTo(px, py)
  }
  c.closePath()
  c.fill()
}

function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, points: number) {
  c.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const rad = i % 2 === 0 ? r : r * 0.45
    const px = x + Math.cos(a) * rad
    const py = y + Math.sin(a) * rad
    i === 0 ? c.moveTo(px, py) : c.lineTo(px, py)
  }
  c.closePath()
  c.fill()
}

function heart(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.beginPath()
  c.moveTo(x, y + s * 0.7)
  c.bezierCurveTo(x - s * 1.3, y - s * 0.4, x - s * 0.4, y - s * 1.2, x, y - s * 0.4)
  c.bezierCurveTo(x + s * 0.4, y - s * 1.2, x + s * 1.3, y - s * 0.4, x, y + s * 0.7)
  c.closePath()
  c.fill()
}
