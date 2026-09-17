import { describe, expect, it } from 'vitest'
import { KEEPER, PITCH } from './constants'
import { keeperSaves, punchClear } from './keeper'
import { makeBall, stepBall, vec } from './physics'

function shotAtTheLine(vx: number, vy: number, vz: number) {
  const ball = makeBall(vec(0, 1.2, PITCH.goalZ))
  return { ...ball, v: vec(vx, vy, vz), resting: false }
}

describe('keeperSaves', () => {
  it('stops a ball within reach and below the bar of his arms', () => {
    expect(keeperSaves(0.5, 1.2, 0)).toBe(true)
    expect(keeperSaves(0, KEEPER.reachHeight + 0.2, 0)).toBe(false)
    expect(keeperSaves(KEEPER.reach + 0.3, 1.2, 0)).toBe(false)
  })
})

describe('punchClear', () => {
  it('puts the ball back on the keeper, not on the goal line', () => {
    const cleared = punchClear(shotAtTheLine(0, -1, -18), 0.4, 1.3)

    expect(cleared.p.z).toBeCloseTo(PITCH.goalZ + KEEPER.standOff)
    expect(cleared.p.z).toBeGreaterThan(PITCH.goalZ)
  })

  it('sends it up and back towards the shooter', () => {
    const cleared = punchClear(shotAtTheLine(0, -1, -18), 0, 1.3)

    expect(cleared.v.z).toBeGreaterThan(0)
    expect(cleared.v.y).toBeGreaterThan(0)
    expect(cleared.spin).toBe(0)
    expect(cleared.resting).toBe(false)
  })

  it('never carries the ball on into the net once it is flying again', () => {
    let ball = punchClear(shotAtTheLine(0, -2, -21), -1.1, 0.6)

    for (let i = 0; i < 30; i++) {
      const before = ball.p.z
      ball = stepBall(ball, 1 / 60)
      expect(ball.p.z).toBeGreaterThanOrEqual(before)
    }
    expect(ball.p.z).toBeGreaterThan(PITCH.goalZ + KEEPER.standOff)
  })

  it('keeps a low save above the grass', () => {
    const cleared = punchClear(shotAtTheLine(0, -3, -20), 0, 0.05)

    expect(cleared.p.y).toBeGreaterThanOrEqual(PITCH.groundY + PITCH.ballRadius)
  })
})
