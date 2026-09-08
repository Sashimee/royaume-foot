import { describe, expect, it } from 'vitest'
import { TOWER } from './constants'
import {
  collideTowers,
  makeTowers,
  restingY,
  standingCount,
  starsForTowers,
  stepTowers,
  towersCleared,
} from './towerGame'
import type { TowerState } from './towerGame'

const BALL_R = 0.34

function blockAt(s: TowerState, column: number, row: number) {
  const b = s.blocks.find((x) => x.column === column && x.row === row)
  if (!b) throw new Error(`no block at ${column},${row}`)
  return b
}

/** Runs a state forward until nothing is still falling, or the cap is hit. */
function settle(s: TowerState, seconds = 4): TowerState {
  let out = s
  for (let t = 0; t < seconds; t += 1 / 60) out = stepTowers(out, 1 / 60)
  return out
}

describe('towers', () => {
  it('builds every tower to full height, standing on the ground', () => {
    const s = makeTowers()
    expect(s.blocks).toHaveLength(TOWER.columns * TOWER.height)
    expect(standingCount(s)).toBe(TOWER.columns * TOWER.height)
    // The lowest block rests on the grass rather than half-buried in it.
    expect(blockAt(s, 0, 0).y).toBeCloseTo(TOWER.blockSize / 2)
    expect(restingY(0)).toBeCloseTo(TOWER.blockSize / 2)
  })

  it('spaces the towers symmetrically about the centre', () => {
    // A child aiming straight ahead should be aiming at something.
    const s = makeTowers()
    const xs = [...new Set(s.blocks.map((b) => b.x))].sort((a, b) => a - b)
    expect(xs).toHaveLength(TOWER.columns)
    expect(xs[0]).toBeCloseTo(-xs[xs.length - 1])
  })

  it('brings the whole tower down when the bottom block is hit', () => {
    // The entire point of the mini-game. Anything less is a stack of blocks
    // that does not behave like a stack of blocks.
    const s = makeTowers()
    const target = blockAt(s, 1, 0)
    const hit = collideTowers(s, { x: target.x, y: target.y, z: target.z }, BALL_R)

    expect(hit.knocked).toBe(TOWER.height)
    expect(hit.justKnocked).toHaveLength(TOWER.height)
    for (let row = 0; row < TOWER.height; row += 1) expect(blockAt(hit, 1, row).v).not.toBeNull()
  })

  it('leaves the blocks below a hit standing', () => {
    const s = makeTowers()
    const target = blockAt(s, 0, 2)
    const hit = collideTowers(s, { x: target.x, y: target.y, z: target.z }, BALL_R)

    expect(blockAt(hit, 0, 0).v).toBeNull()
    expect(blockAt(hit, 0, 1).v).toBeNull()
    expect(blockAt(hit, 0, 2).v).not.toBeNull()
    expect(hit.knocked).toBe(TOWER.height - 2)
  })

  it('leaves the other towers alone', () => {
    const s = makeTowers()
    const target = blockAt(s, 0, 0)
    const hit = collideTowers(s, { x: target.x, y: target.y, z: target.z }, BALL_R)

    expect(standingCount(hit)).toBe(TOWER.columns * TOWER.height - TOWER.height)
    for (let row = 0; row < TOWER.height; row += 1) expect(blockAt(hit, 2, row).v).toBeNull()
  })

  it('topples a tower the ball only grazes', () => {
    // A shot the child can see touching the tower must knock it over. Being
    // stricter than their eyes is the same as telling them they missed when
    // they did not.
    const s = makeTowers()
    const target = blockAt(s, 1, 0)
    const graze = { x: target.x + TOWER.blockSize / 2 + BALL_R + TOWER.hitPadding - 0.02, y: target.y, z: target.z }

    expect(collideTowers(s, graze, BALL_R).knocked).toBe(TOWER.height)
  })

  it('does nothing when the ball passes clear of every tower', () => {
    const s = makeTowers()
    const miss = collideTowers(s, { x: 0, y: 6, z: TOWER.z }, BALL_R)
    expect(miss.knocked).toBe(0)
    expect(miss).toBe(s)
  })

  it('does not knock the same block twice', () => {
    const s = makeTowers()
    const target = blockAt(s, 1, 0)
    const at = { x: target.x, y: target.y, z: target.z }
    const once = collideTowers(s, at, BALL_R)
    const twice = collideTowers(once, at, BALL_R)

    expect(twice.knocked).toBe(once.knocked)
    expect(twice.justKnocked).toHaveLength(0)
  })

  it('lands every knocked block on the ground and stops it there', () => {
    const s = makeTowers()
    const target = blockAt(s, 1, 0)
    const settled = settle(collideTowers(s, { x: target.x, y: target.y, z: target.z }, BALL_R))

    for (let row = 0; row < TOWER.height; row += 1) {
      const b = blockAt(settled, 1, row)
      expect(b.landed).toBe(true)
      expect(b.y).toBeCloseTo(TOWER.floorY)
    }
  })

  it('scatters a toppling tower sideways instead of dropping it in place', () => {
    const s = makeTowers()
    const target = blockAt(s, 1, 0)
    // Struck from the left, so everything should end up to the right of centre.
    const hit = collideTowers(s, { x: target.x - 0.3, y: target.y, z: target.z }, BALL_R)
    const settled = settle(hit)

    expect(blockAt(settled, 1, TOWER.height - 1).x).toBeGreaterThan(target.x)
  })

  it('tumbles a knocked block as it falls, and stops when it lands', () => {
    const s = makeTowers()
    const target = blockAt(s, 1, 0)
    const hit = collideTowers(s, { x: target.x, y: target.y, z: target.z }, BALL_R)

    const mid = stepTowers(hit, 0.1)
    expect(Math.abs(blockAt(mid, 1, 3).angle)).toBeGreaterThan(0)

    const settled = settle(mid)
    const landed = blockAt(settled, 1, 3)
    const after = stepTowers(settled, 0.1)
    expect(blockAt(after, 1, 3).angle).toBe(landed.angle)
  })

  it('stands a rebuilt tower back up square', () => {
    // The towers are rebuilt once they are all down, so a child with shots left
    // still has something to aim at. The tumble used to be accumulated straight
    // onto the mesh and nothing reset it, so the new towers were stacked out of
    // the tilted blocks left over from the old ones.
    let s = makeTowers()
    for (let column = 0; column < TOWER.columns; column += 1) {
      const target = blockAt(s, column, 0)
      s = collideTowers(s, { x: target.x, y: target.y, z: target.z }, BALL_R)
    }
    const knockedOver = settle(s)
    expect(towersCleared(knockedOver)).toBe(true)
    // Worth asserting, or the check below would pass on a state that never tilted.
    expect(knockedOver.blocks.some((b) => b.angle !== 0)).toBe(true)

    const rebuilt = { ...makeTowers(), knocked: knockedOver.knocked }
    for (const b of rebuilt.blocks) {
      expect(b.angle).toBe(0)
      expect(b.y).toBeCloseTo(restingY(b.row))
    }
    expect(rebuilt.knocked).toBe(knockedOver.knocked)
  })

  it('never moves a block that was never hit', () => {
    const s = makeTowers()
    const settled = settle(s)
    for (const b of settled.blocks) {
      expect(b.y).toBeCloseTo(restingY(b.row))
      expect(b.landed).toBe(false)
    }
  })

  it('knows when there is nothing left standing', () => {
    let s = makeTowers()
    expect(towersCleared(s)).toBe(false)
    for (let column = 0; column < TOWER.columns; column += 1) {
      const target = blockAt(s, column, 0)
      s = collideTowers(s, { x: target.x, y: target.y, z: target.z }, BALL_R)
    }
    expect(towersCleared(s)).toBe(true)
  })
})

describe('tower scoring', () => {
  it('never gives zero stars', () => {
    // Rule 3: nothing in this game may look like a punishment.
    for (let knocked = 0; knocked <= TOWER.columns * TOWER.height; knocked += 1) {
      expect(starsForTowers(knocked)).toBeGreaterThanOrEqual(1)
    }
  })

  it('rises with the number knocked over and caps at three', () => {
    expect(starsForTowers(0)).toBe(1)
    expect(starsForTowers(TOWER.twoStarBlocks)).toBe(2)
    expect(starsForTowers(TOWER.threeStarBlocks)).toBe(3)
    expect(starsForTowers(TOWER.columns * TOWER.height)).toBe(3)
  })

  it('leaves three stars reachable inside a round', () => {
    // The harness question, not a unit test: can a child who plays well
    // actually get there? Three well-placed shots bring down three towers.
    const reachable = TOWER.columns * TOWER.height
    expect(TOWER.threeStarBlocks).toBeLessThanOrEqual(reachable)
    expect(TOWER.columns).toBeLessThanOrEqual(TOWER.shotsPerRound)
  })
})
