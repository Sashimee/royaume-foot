import { describe, expect, it } from 'vitest'
import { CUP_LEGS } from '../game/cup'
import { MAP, PLACES } from './mapPlaces'

const half = MAP.medallion / 2

describe('the kingdom map', () => {
  it('walks the places in the cup order, because the road IS the cup route', () => {
    expect(PLACES.map((p) => p.mode)).toEqual([...CUP_LEGS])
  })

  it('keeps every medallion and its name plate inside the map', () => {
    for (const p of PLACES) {
      expect(p.x - half).toBeGreaterThanOrEqual(0)
      expect(p.x + half).toBeLessThanOrEqual(MAP.width)
      expect(p.y - half).toBeGreaterThanOrEqual(0)
      // The plate hangs below the medallion, and the map clips its overflow.
      expect(p.y + half + MAP.labelHeight).toBeLessThanOrEqual(MAP.height)
    }
  })

  it('never lets two medallions touch', () => {
    for (const [a, b] of pairs()) {
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(MAP.medallion)
    }
  })

  it('never lets two name plates collide', () => {
    // Two places sharing a column need the height of a medallion and a plate
    // between them; side by side they only need the plates not to meet. A
    // 320px phone scales both the same way, so this holds at every width.
    for (const [a, b] of pairs()) {
      const sameColumn = Math.abs(a.x - b.x) < MAP.labelWidth
      if (!sameColumn) continue
      expect(Math.abs(a.y - b.y)).toBeGreaterThanOrEqual(half + MAP.labelHeight + half)
    }
  })
})

function pairs(): [(typeof PLACES)[number], (typeof PLACES)[number]][] {
  return PLACES.flatMap((a, i) => PLACES.slice(i + 1).map((b) => [a, b] as [typeof a, typeof b]))
}
