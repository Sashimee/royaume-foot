import { describe, expect, it } from 'vitest'
import { ACCESSORIES, accessoryById, replaces } from './accessories'

describe('accessories', () => {
  it('has unique ids', () => {
    const ids = ACCESSORIES.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every item its own badge', () => {
    // Two cards showing the same emoji are two cards a non-reader cannot tell
    // apart, and the name under them is the part they cannot use.
    const badges = ACCESSORIES.map((a) => a.badge)
    expect(new Set(badges).size).toBe(badges.length)
  })

  it('starts with the empty slot, free, wearing nothing', () => {
    const first = ACCESSORIES[0]
    expect(first.unlockStars).toBe(0)
    expect(first.kind).toBe('none')
    expect(first.mount).toBe('none')
  })

  it('charges for everything else', () => {
    // Exactly one free entry: the reward loop is thresholds, and an accessory
    // that costs nothing is not a reward.
    expect(ACCESSORIES.filter((a) => a.unlockStars === 0)).toHaveLength(1)
  })

  it('prices the ladder in strictly increasing order', () => {
    const prices = ACCESSORIES.map((a) => a.unlockStars)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
    expect(new Set(prices).size).toBe(prices.length)
  })

  it('gives every worn item a real mount', () => {
    for (const a of ACCESSORIES.slice(1)) {
      expect(a.mount === 'head' || a.mount === 'back').toBe(true)
      expect(a.kind).not.toBe('none')
    }
  })

  it('alternates head and back so the next reward changes the silhouette', () => {
    const worn = ACCESSORIES.slice(1).map((a) => a.mount)
    for (let i = 1; i < worn.length; i++) expect(worn[i]).not.toBe(worn[i - 1])
  })

  it('falls back to the free slot for an id it does not ship', () => {
    expect(accessoryById('a-save-from-a-future-build').id).toBe(ACCESSORIES[0].id)
    expect(accessoryById('ailes-fee').kind).toBe('fairy')
  })

  it('replaces the character piece at its own mount and nowhere else', () => {
    const wings = accessoryById('ailes-fee')
    expect(replaces(wings, 'back')).toBe(true)
    expect(replaces(wings, 'head')).toBe(false)

    const nothing = ACCESSORIES[0]
    expect(replaces(nothing, 'head')).toBe(false)
    expect(replaces(nothing, 'back')).toBe(false)
  })
})
