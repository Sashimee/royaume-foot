/**
 * The quality bench: contrast, tap targets and draw calls, measured rather than
 * asserted.
 *
 *   npx vite --port 5173 &
 *   node scripts/quality-bench.mjs
 *
 * Contrast is read off the RENDERED PIXELS — the screenshot is drawn back into
 * a canvas in the page — because this UI is built from gradients, translucent
 * plates and a 3D scene showing through the HUD. Computing it from CSS colours
 * would have missed the bug it found: a locked item's star price sat on a
 * translucent chip, so it read at 7:1 beside the princesses and 1.05:1 by the
 * time it reached the last knight, further down the same gradient.
 *
 * Draw calls are counted by wrapping the WebGL context before any app code
 * runs. Frame times are deliberately NOT reported: this machine has no GPU, and
 * a number from a software rasteriser would be worse than no number at all.
 * The plan's budget is under 40 draw calls (docs/plan.md, "Budget performance").
 */
import { chromium } from '@playwright/test'

const URL = process.env.BENCH_URL || 'http://localhost:5173/'

function sampleContrast(shot) { return new Promise((done) => {
  const img = new Image()
  img.onload = () => {
    const c = document.createElement('canvas')
    c.width = img.width; c.height = img.height
    const ctx = c.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const dpr = img.width / window.innerWidth

    const lum = (r, g, b) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }

    const out = []
    const seen = new Set()
    for (const el of document.querySelectorAll('button, h1, h2, p, span, a')) {
      const text = (el.textContent || '').trim()
      if (!text || text.length > 60) continue
      // Only leaf-ish text, and skip pure-emoji labels (contrast is meaningless
      // for a multicolour glyph).
      if (el.querySelector('button, h1, h2, p, span')) continue
      if (!/[a-zA-Z0-9À-ÿ]/.test(text)) continue
      const r = el.getBoundingClientRect()
      if (r.width < 8 || r.height < 8) continue
      if (r.top < 0 || r.left < 0 || r.bottom > window.innerHeight || r.right > window.innerWidth) continue
      // Actually painted? An element scrolled past its container's clip edge
      // still reports a rect inside the viewport, and samples as a uniform
      // patch of whatever is drawn there instead.
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      if (!hit || !(el.contains(hit) || hit.contains(el))) continue
      const key = text + '@' + Math.round(r.top)
      if (seen.has(key)) continue
      seen.add(key)

      const x0 = Math.max(0, Math.round(r.left * dpr)), y0 = Math.max(0, Math.round(r.top * dpr))
      const w = Math.min(c.width - x0, Math.round(r.width * dpr)), h = Math.min(c.height - y0, Math.round(r.height * dpr))
      if (w < 4 || h < 4) continue
      const d = ctx.getImageData(x0, y0, w, h).data

      const ls = []
      for (let i = 0; i < d.length; i += 4) ls.push(lum(d[i], d[i + 1], d[i + 2]))
      ls.sort((a, b) => a - b)
      // The glyphs are the brightest slice, the plate behind them the darkest —
      // or the reverse. Take the 5th and 95th percentile so antialiasing and a
      // stray highlight do not set the answer.
      const lo = ls[Math.floor(ls.length * 0.05)]
      const hi = ls[Math.floor(ls.length * 0.95)]
      const ratio = (Math.max(lo, hi) + 0.05) / (Math.min(lo, hi) + 0.05)

      const size = parseFloat(getComputedStyle(el).fontSize)
      const weight = parseInt(getComputedStyle(el).fontWeight) || 400
      // WCAG "large text": >=24px, or >=18.66px when bold.
      const large = size >= 24 || (size >= 18.66 && weight >= 700)
      out.push({ text: text.slice(0, 34), ratio: +ratio.toFixed(2), size: Math.round(size), large, need: large ? 3 : 4.5 })
    }
    done(out)
  }
  img.src = shot
}) }

const HOOK = `
  window.__draws = 0
  window.__frames = 0
  for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
    for (const fn of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
      const original = proto[fn]
      if (!original) continue
      proto[fn] = function (...args) { window.__draws++; return original.apply(this, args) }
    }
  }
  const raf = window.requestAnimationFrame.bind(window)
  const count = () => { window.__frames++; raf(count) }
  raf(count)
`

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
})

const SCREENS = [
  ['menu', null],
  ['wardrobe', /dress up|habiller/i],
  ['shoot', /shoot|tirer/i],
  ['keep', /keeper|gardienne/i],
  ['run', /star run|course/i],
  ['tower', /towers|casse/i],
]

console.log('\n== Contrast (WCAG AA) and tap targets (this project: 64px)')
for (const [name, button] of SCREENS) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.goto(URL)
  await page.evaluate(() => localStorage.setItem('royaume-foot:lang', 'fr'))
  await page.reload()
  await page.waitForTimeout(2200)
  if (button) {
    await page.getByRole('button', { name: button }).first().click()
    await page.waitForTimeout(2200)
  }
  const shot = 'data:image/png;base64,' + (await page.screenshot()).toString('base64')
  const rows = await page.evaluate(sampleContrast, shot)
  const bad = rows.filter((r) => r.ratio < r.need)
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('button, [role="tab"]')]
      .map((b) => ({ t: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 20), ...b.getBoundingClientRect().toJSON() }))
      .filter((b) => b.width > 0 && (b.width < 64 || b.height < 64))
      .map((b) => `${Math.round(b.width)}x${Math.round(b.height)} "${b.t}"`))
  console.log(`  ${name.padEnd(9)} ${String(rows.length).padStart(3)} labels, ${bad.length} below AA${small.length ? `, ${small.length} tap targets under 64px` : ''}`)
  for (const r of bad) console.log(`      ${r.ratio.toFixed(2)} (needs ${r.need}) ${r.size}px  "${r.text}"`)
  for (const t of small) console.log(`      ${t}`)
  await page.close()
}

console.log('\n== Draw calls per frame (budget: under 40)')
for (const [name, button] of SCREENS) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.addInitScript(HOOK)
  await page.goto(URL)
  await page.waitForTimeout(2000)
  if (button) {
    await page.getByRole('button', { name: button }).first().click()
    await page.waitForTimeout(2500)
  }
  await page.evaluate(() => { window.__draws = 0; window.__frames = 0 })
  await page.waitForTimeout(4000)
  const { draws, frames } = await page.evaluate(() => ({ draws: window.__draws, frames: window.__frames }))
  const per = Math.round(draws / Math.max(1, frames))
  console.log(`  ${name.padEnd(9)} ${String(per).padStart(4)} ${per > 40 ? '  OVER BUDGET' : ''}`)
  await page.close()
}

await browser.close()
