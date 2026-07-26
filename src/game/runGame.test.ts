import { describe, expect, it } from 'vitest'
import { RUN } from './constants'
import { makeRun, runIsOver, runProgress, starsForRun, stepRun, stepRunner } from './runGame'
import type { RunState } from './runGame'

/** Plays a whole run with a given steering policy and reports the result. */
function playRun(steer: (s: RunState) => number): RunState {
  let s = makeRun()
  while (!runIsOver(s)) s = stepRun(s, 1 / 60, steer(s))
  return s
}

/** A child who chases the nearest star, after a reaction delay. */
function chaseNearest(lag: number) {
  let held = 0
  let sinceChange = 0
  return (s: RunState) => {
    sinceChange += 1 / 60
    if (sinceChange >= lag) {
      const ahead = s.items.filter((i) => i.z < RUN.playerZ)
      if (ahead.length > 0) {
        held = ahead.reduce((a, b) => (b.z > a.z ? b : a)).x
        sinceChange = 0
      }
    }
    return held
  }
}

describe('stepRunner', () => {
  it('moves towards the finger and is speed-capped', () => {
    expect(stepRunner(0, 5, 0.1)).toBeCloseTo(RUN.playerSpeed * 0.1, 6)
  })

  it('stays within the lane', () => {
    expect(Math.abs(stepRunner(0, 99, 10))).toBeLessThanOrEqual(RUN.laneHalfWidth + 0.6)
  })
})

describe('stepRun', () => {
  it('is pure — the input state is untouched', () => {
    const s = makeRun()
    const snapshot = JSON.stringify(s)
    stepRun(s, 0.5, 2)
    expect(JSON.stringify(s)).toBe(snapshot)
  })

  it('brings stars towards the runner', () => {
    let s = makeRun()
    for (let i = 0; i < 120; i++) s = stepRun(s, 1 / 60, 0)
    expect(s.items.length).toBeGreaterThan(0)
    expect(Math.max(...s.items.map((i) => i.z))).toBeGreaterThan(RUN.spawnZ)
  })

  it('collects a star the runner is standing on', () => {
    let s: RunState = { ...makeRun(), items: [{ id: 1, x: 0, z: RUN.playerZ, big: false }] }
    s = stepRun(s, 1 / 60, 0)
    expect(s.collected).toBe(1)
    expect(s.justCollected).toEqual([1])
    expect(s.items).toHaveLength(0)
  })

  it('misses a star the runner is nowhere near', () => {
    let s: RunState = { ...makeRun(), items: [{ id: 1, x: 3, z: RUN.playerZ, big: false }] }
    s = stepRun(s, 1 / 60, 0)
    expect(s.collected).toBe(0)
  })

  it('counts golden stars separately', () => {
    let s: RunState = { ...makeRun(), items: [{ id: 1, x: 0, z: RUN.playerZ, big: true }] }
    s = stepRun(s, 1 / 60, 0)
    expect(s.bigCollected).toBe(1)
  })

  it('drops stars that went past, so the list cannot grow forever', () => {
    const s = playRun(() => 99)
    expect(s.items.length).toBeLessThan(20)
  })

  it('stops spawning once the run is over', () => {
    let s = makeRun()
    while (!runIsOver(s)) s = stepRun(s, 1 / 60, 0)
    const idAtEnd = s.nextId
    s = stepRun(s, 1, 0)
    expect(s.nextId).toBe(idAtEnd)
  })

  it('never spawns a star outside the lane', () => {
    let s = makeRun()
    const seen: number[] = []
    while (!runIsOver(s)) {
      s = stepRun(s, 1 / 60, 0)
      for (const i of s.items) seen.push(Math.abs(i.x))
    }
    expect(Math.max(...seen)).toBeLessThanOrEqual(RUN.laneHalfWidth + 1e-9)
  })
})

describe('runProgress', () => {
  it('runs from zero to one and stops there', () => {
    expect(runProgress(makeRun())).toBe(0)
    expect(runProgress({ ...makeRun(), t: RUN.duration * 2 })).toBe(1)
  })
})

describe('starsForRun', () => {
  it('never returns zero, even for a child who collected nothing', () => {
    expect(starsForRun(0, 0)).toBe(1)
  })

  it('rewards chasing the golden ones', () => {
    expect(starsForRun(RUN.twoStarScore - 1, 1)).toBe(2)
  })

  it('gives three for a strong run', () => {
    expect(starsForRun(RUN.threeStarScore, 0)).toBe(3)
  })
})

/**
 * Difficulty harness, matching the other two modes. It plays a *child*, not an
 * optimum: chase the nearest star, react slowly.
 */
describe('difficulty balance (running)', () => {
  it('an attentive child sweeps up most of them', () => {
    const s = playRun(chaseNearest(0.2))
    expect(s.collected / s.nextId).toBeGreaterThan(0.55)
  })

  it('a child who never moves still gets some — the lane crosses the middle', () => {
    const s = playRun(() => 0)
    expect(s.collected).toBeGreaterThan(0)
  })

  it('an attentive child reaches two stars but not automatically three', () => {
    const s = playRun(chaseNearest(0.2))
    expect(starsForRun(s.collected, s.bigCollected)).toBeGreaterThanOrEqual(2)
  })

  it('a child who never moves is not shut out of a reward', () => {
    const s = playRun(() => 0)
    expect(starsForRun(s.collected, s.bigCollected)).toBeGreaterThanOrEqual(1)
  })
})
