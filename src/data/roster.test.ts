import { describe, expect, it } from 'vitest'
import { BALLS, CHARACTERS, KNIGHTS, PRINCESSES, characterById, nextUnlock } from './roster'
import { STADIUMS, stadiumById } from './stadiums'
import { MASCOTS, mascotById } from './mascots'

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
    // Every kind of unlockable counts, stadiums included — the teaser reads
    // from all of them.
    const highest = Math.max(...[...CHARACTERS, ...BALLS, ...STADIUMS, ...MASCOTS].map((i) => i.unlockStars))
    expect(nextUnlock(highest)).toBeNull()
  })
})

describe('stadiums', () => {
  it('gives a free place to play from the first launch', () => {
    expect(STADIUMS.filter((s) => s.unlockStars === 0).length).toBeGreaterThan(0)
  })

  it('has unique ids', () => {
    const ids = STADIUMS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('falls back to a playable stadium for an unknown id', () => {
    expect(stadiumById('nowhere').unlockStars).toBe(0)
  })

  it('gives every stadium a full palette', () => {
    // A missing colour renders as black, which is very obvious in play and very
    // easy to miss when adding an entry.
    for (const s of STADIUMS) {
      for (const [key, value] of Object.entries(s)) {
        if (key === 'unlockStars' || key === 'id' || key === 'badge') continue
        expect(typeof value === 'string' && value.length > 0).toBe(true)
      }
    }
  })

  it('never leaves a long stretch with nothing to earn', () => {
    // The real property, rather than "the last unlock is a stadium": a child
    // should always have a reward within a couple of rounds. A ten-star gap is
    // a grind at this age, whatever sits on either side of it.
    const thresholds = [...new Set([...CHARACTERS, ...BALLS, ...STADIUMS, ...MASCOTS].map((i) => i.unlockStars))]
      .sort((a, b) => a - b)
    const gaps = thresholds.slice(1).map((n, i) => n - thresholds[i])
    expect(Math.max(...gaps)).toBeLessThanOrEqual(6)
  })
})

describe('mascots', () => {
  it('gives a free companion from the first launch', () => {
    expect(MASCOTS.filter((m) => m.unlockStars === 0).length).toBeGreaterThan(0)
  })

  it('has unique ids', () => {
    const ids = MASCOTS.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('falls back to a real mascot for an unknown id', () => {
    expect(mascotById('nobody').unlockStars).toBe(0)
  })

  it('draws every mascot kind', () => {
    // A kind with no branch in Extras() renders a bare body, which looks like a
    // bug rather than like a pet.
    const kinds = new Set(MASCOTS.map((m) => m.kind))
    expect(kinds.size).toBe(MASCOTS.length)
  })
})
