import { describe, expect, it } from 'vitest'
import { BALLS, CHARACTERS, KNIGHTS, PRINCESSES, characterById, nextUnlock, unlockedBetween } from './roster'
import { STADIUMS, stadiumById } from './stadiums'
import { MASCOTS, mascotById } from './mascots'
import { KEEPERS, keeperById } from './keepers'
import { ACCESSORIES } from './accessories'

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
    const highest = Math.max(
      ...[...CHARACTERS, ...BALLS, ...STADIUMS, ...MASCOTS, ...KEEPERS, ...ACCESSORIES].map(
        (i) => i.unlockStars,
      ),
    )
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
    const thresholds = [
      ...new Set([...CHARACTERS, ...BALLS, ...STADIUMS, ...MASCOTS, ...KEEPERS].map((i) => i.unlockStars)),
    ]
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

describe('keepers', () => {
  it('gives a keeper to play against from the very first launch', () => {
    // Without a free one the shooting mode has an empty goal on a new save.
    expect(KEEPERS.filter((k) => k.unlockStars === 0).length).toBeGreaterThan(0)
  })

  it('has unique ids', () => {
    const ids = KEEPERS.map((k) => k.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('falls back to a real keeper for an unknown id', () => {
    expect(keeperById('nobody').unlockStars).toBe(0)
  })

  it('draws every keeper kind', () => {
    // A kind with no branch in three/Keeper.tsx renders nothing at all, which
    // in shooting mode is an empty goal rather than an obvious crash.
    const kinds = new Set(KEEPERS.map((k) => k.kind))
    expect(kinds.size).toBe(KEEPERS.length)
  })

  it('gives every keeper a badge and a full palette', () => {
    // A missing colour renders as black. On a keeper standing in the goal that
    // reads as a hole in the world, and it is very easy to miss when adding one.
    for (const k of KEEPERS) {
      expect(k.badge.length).toBeGreaterThan(0)
      for (const [key, value] of Object.entries(k)) {
        if (key === 'unlockStars') continue
        expect(typeof value === 'string' && value.length > 0).toBe(true)
      }
    }
  })

  describe('unlockedBetween', () => {
    it('reports what a round just opened up, cheapest first', () => {
      const opened = unlockedBetween(1, 3)
      expect(opened.length).toBeGreaterThan(0)
      for (const item of opened) {
        expect(item.unlockStars).toBeGreaterThan(1)
        expect(item.unlockStars).toBeLessThanOrEqual(3)
      }
      const thresholds = opened.map((i) => i.unlockStars)
      expect([...thresholds].sort((a, b) => a - b)).toEqual(thresholds)
    })

    it('is empty when no threshold was crossed', () => {
      // The reveal must not fire on a round that earned nothing new, or the
      // celebration stops meaning anything.
      expect(unlockedBetween(3, 3)).toEqual([])
      expect(unlockedBetween(0, 1)).toEqual([])
    })

    it('never re-reports something already owned', () => {
      // Every item is claimed exactly once across the whole star range, so a
      // child cannot be told twice that the same thing arrived.
      const seen = new Map<string, number>()
      for (let s = 0; s < 40; s++) {
        for (const item of unlockedBetween(s, s + 1)) {
          seen.set(`${item.badge}-${item.unlockStars}`, (seen.get(`${item.badge}-${item.unlockStars}`) ?? 0) + 1)
        }
      }
      for (const count of seen.values()) expect(count).toBe(1)
    })

    it('never claims the free items, which were never locked', () => {
      // `before` is the star count the round started from, so it is never
      // negative and a threshold of 0 can never fall inside the window.
      expect(unlockedBetween(0, 12).some((i) => i.unlockStars === 0)).toBe(false)
    })
  })
})
