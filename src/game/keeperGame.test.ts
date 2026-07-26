import { describe, expect, it } from 'vitest'
import { KEEP, PITCH, ROUND, visibleHalfWidthAt } from './constants'
import {
  ballPosAt,
  isSave,
  makeAttempt,
  seededRandom,
  starsForSaves,
  stepPlayerKeeper,
} from './keeperGame'

describe('makeAttempt', () => {
  const rand = seededRandom(7)
  const attempts = Array.from({ length: 400 }, () => makeAttempt(rand))

  it('never aims outside the posts', () => {
    for (const a of attempts) {
      expect(Math.abs(a.targetX)).toBeLessThan(PITCH.goalHalfWidth)
    }
  })

  it('never aims where she physically cannot reach', () => {
    for (const a of attempts) {
      expect(a.targetY).toBeLessThanOrEqual(KEEP.reachHeight)
    }
  })

  it('uses the whole goal, not just the middle', () => {
    const widest = Math.max(...attempts.map((a) => Math.abs(a.targetX)))
    expect(widest).toBeGreaterThan(PITCH.goalHalfWidth * 0.6)
  })

  it('never puts the shooter in front of the goal mouth', () => {
    // Regression: a centred shooter occluded the goal, the ball and the
    // telegraph ring all at once.
    for (const a of attempts) {
      expect(Math.abs(a.fromX)).toBeGreaterThanOrEqual(KEEP.shooterMinX)
    }
  })

  it('keeps the whole shooter on screen', () => {
    // Regression: at 4.0 off centre the dragon was clipped by the side of the
    // frame. The camera fits the goal at the goal line, so anything nearer has
    // proportionally less room — the goal's own half-width is not the limit.
    const room = visibleHalfWidthAt(KEEP.shooterZ)
    const furthest = KEEP.shooterMinX + KEEP.shooterSideSpread + KEEP.shooterHalfWidth
    expect(furthest).toBeLessThan(room)
  })

  it('shoots from both sides', () => {
    expect(attempts.some((a) => a.fromX < 0)).toBe(true)
    expect(attempts.some((a) => a.fromX > 0)).toBe(true)
  })

  it('is reproducible from a seed', () => {
    const a = makeAttempt(seededRandom(42))
    const b = makeAttempt(seededRandom(42))
    expect(a).toEqual(b)
  })
})

describe('ballPosAt', () => {
  const attempt = { targetX: 2.5, targetY: 1.4, fromX: -1 }

  it('starts at the shooter', () => {
    const p = ballPosAt(attempt, 0)
    expect(p.x).toBeCloseTo(attempt.fromX, 6)
    expect(p.z).toBeCloseTo(KEEP.shooterZ, 6)
  })

  it('lands exactly on the telegraphed spot — the ring must not lie', () => {
    const p = ballPosAt(attempt, KEEP.flightTime)
    expect(p.x).toBeCloseTo(attempt.targetX, 6)
    expect(p.y).toBeCloseTo(attempt.targetY, 6)
    expect(p.z).toBeCloseTo(PITCH.goalZ, 6)
  })

  it('arcs rather than travelling in a straight line', () => {
    const mid = ballPosAt(attempt, KEEP.flightTime / 2)
    const straightY = (ballPosAt(attempt, 0).y + ballPosAt(attempt, KEEP.flightTime).y) / 2
    expect(mid.y).toBeGreaterThan(straightY)
  })

  it('stays above the grass for the whole flight', () => {
    for (let t = 0; t <= KEEP.flightTime; t += 0.02) {
      expect(ballPosAt(attempt, t).y).toBeGreaterThan(0)
    }
  })
})

describe('stepPlayerKeeper', () => {
  it('moves towards the finger', () => {
    expect(stepPlayerKeeper(0, 3, 0.1)).toBeGreaterThan(0)
    expect(stepPlayerKeeper(0, -3, 0.1)).toBeLessThan(0)
  })

  it('is speed-capped, not a teleport', () => {
    const moved = stepPlayerKeeper(0, 100, 0.1)
    expect(moved).toBeCloseTo(KEEP.maxSpeed * 0.1, 6)
  })

  it('snaps to the target once within reach of it', () => {
    expect(stepPlayerKeeper(0, 0.01, 0.1)).toBeCloseTo(0.01, 6)
  })

  it('never leaves the goal', () => {
    expect(stepPlayerKeeper(0, 99, 10)).toBeLessThan(PITCH.goalHalfWidth)
    expect(stepPlayerKeeper(0, -99, 10)).toBeGreaterThan(-PITCH.goalHalfWidth)
  })

  it('can cross the whole goal within one wind-up plus flight', () => {
    // If this fails the mode becomes unfair: a shot to the far corner would be
    // physically unreachable however well the child reacts.
    const window = KEEP.windUp + KEEP.flightTime
    expect(KEEP.maxSpeed * window).toBeGreaterThan(PITCH.goalHalfWidth * 2)
  })
})

describe('isSave', () => {
  it('saves what she is standing in front of', () => {
    expect(isSave({ targetX: 1, targetY: 1, fromX: 0 }, 1)).toBe(true)
  })

  it('saves within her reach', () => {
    expect(isSave({ targetX: 1 + KEEP.reach - 0.01, targetY: 1, fromX: 0 }, 1)).toBe(true)
  })

  it('concedes beyond her reach', () => {
    expect(isSave({ targetX: 1 + KEEP.reach + 0.01, targetY: 1, fromX: 0 }, 1)).toBe(false)
  })
})

describe('starsForSaves', () => {
  it('never returns zero, even for a shut-out', () => {
    expect(starsForSaves(0, ROUND.shotsPerRound)).toBe(1)
  })

  it('gives three for a perfect round', () => {
    expect(starsForSaves(ROUND.shotsPerRound, ROUND.shotsPerRound)).toBe(3)
  })

  it('gives two for a good one', () => {
    expect(starsForSaves(3, 5)).toBe(2)
  })
})

/**
 * Difficulty harness for the keeping mode, mirroring the shooting one.
 *
 * It simulates a *child*, not an optimum: a reaction delay, then moving towards
 * the ring at top speed. If tuning ever makes this unkind, this fails.
 */
describe('difficulty balance (keeping)', () => {
  function playRound(reactionDelay: number, seed: number) {
    const rand = seededRandom(seed)
    let saves = 0
    const shots = 200

    for (let i = 0; i < shots; i++) {
      const attempt = makeAttempt(rand)
      let keeperX = 0
      const total = KEEP.windUp + KEEP.flightTime
      for (let t = 0; t < total; t += 1 / 60) {
        // Before reacting she stays put; after, she heads for the target.
        const wants = t < reactionDelay ? keeperX : attempt.targetX
        keeperX = stepPlayerKeeper(keeperX, wants, 1 / 60)
      }
      if (isSave(attempt, keeperX)) saves++
    }
    return saves / shots
  }

  it('an attentive child saves nearly everything', () => {
    expect(playRound(0.25, 11)).toBeGreaterThan(0.9)
  })

  it('a distracted child still saves plenty', () => {
    // 1.2s of reaction eats the whole wind-up and part of the flight.
    expect(playRound(1.2, 12)).toBeGreaterThan(0.5)
  })

  it('is not a formality — dawdling costs goals', () => {
    expect(playRound(1.7, 13)).toBeLessThan(0.9)
  })
})
