import { describe, expect, it } from 'vitest'
import { BALLS, CHARACTERS, KNIGHTS, PRINCESSES, characterById, nextUnlock } from './roster'

describe('roster', () => {
  it('offers both kinds of character', () => {
    expect(PRINCESSES.length).toBeGreaterThan(0)
    expect(KNIGHTS.length).toBeGreaterThan(0)
    expect(CHARACTERS).toHaveLength(PRINCESSES.length + KNIGHTS.length)
  })

  it('lets a child play either kind from the very first launch', () => {
    // Locking every knight behind stars would tell a child who wants a knight
    // that the game is not for them yet.
    for (const kind of ['princess', 'knight'] as const) {
      const free = CHARACTERS.filter((c) => c.kind === kind && c.unlockStars === 0)
      expect(free.length).toBeGreaterThan(0)
    }
  })

  it('has unique ids across both kinds', () => {
    const ids = CHARACTERS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every character a badge, so the picker needs no reading', () => {
    for (const c of [...CHARACTERS, ...BALLS]) expect(c.badge.length).toBeGreaterThan(0)
  })

  it('falls back to a playable character for an unknown id', () => {
    expect(characterById('nobody').unlockStars).toBe(0)
  })

  it('always has something left to unlock at zero stars', () => {
    expect(nextUnlock(0)).not.toBeNull()
  })

  it('has nothing left to unlock once every threshold is passed', () => {
    const highest = Math.max(...[...CHARACTERS, ...BALLS].map((i) => i.unlockStars))
    expect(nextUnlock(highest)).toBeNull()
  })
})
