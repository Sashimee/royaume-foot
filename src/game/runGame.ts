import { RUN } from './constants'

/**
 * "Course aux étoiles" — the character runs down the pitch and the child steers
 * them left and right to sweep up stars.
 *
 * There is nothing to crash into and nothing to dodge. The whole mini-game is
 * *go and get the shiny things*, which is the simplest possible verb and the
 * only one that needs no explanation at this age. Difficulty is entirely in how
 * spread out the stars are, never in punishment.
 */

export interface Collectible {
  id: number
  x: number
  /** Distance still to travel towards the runner; it decreases every step. */
  z: number
  /** Golden stars are rarer and worth more. */
  big: boolean
}

export interface RunState {
  /** Seconds elapsed in the run. */
  t: number
  playerX: number
  items: Collectible[]
  collected: number
  bigCollected: number
  /** Time of the next spawn, in run seconds. */
  nextSpawn: number
  nextId: number
  /** Ids picked up on the last step, for the effects layer to react to. */
  justCollected: number[]
}

export function makeRun(): RunState {
  return {
    t: 0,
    playerX: 0,
    items: [],
    collected: 0,
    bigCollected: 0,
    nextSpawn: RUN.firstSpawn,
    nextId: 1,
    justCollected: [],
  }
}

export function runIsOver(s: RunState): boolean {
  return s.t >= RUN.duration
}

/** 0..1 — drives the time bar in the HUD. */
export function runProgress(s: RunState): number {
  return Math.min(1, s.t / RUN.duration)
}

/**
 * Advances the run by `dt`, steering the runner towards `wantedX`.
 *
 * Pure, like the other two mini-games: it takes a state and returns a new one,
 * so the whole thing can be played out in a test without a canvas.
 */
export function stepRun(state: RunState, dt: number, wantedX: number): RunState {
  const playerX = stepRunner(state.playerX, wantedX, dt)
  const t = state.t + dt

  // Spawning stops once the run is over so the last seconds are not cluttered
  // with stars nobody can reach.
  let { nextSpawn, nextId } = state
  const items = state.items.map((item) => ({ ...item, z: item.z + RUN.speed * dt }))
  while (t >= nextSpawn && nextSpawn < RUN.duration) {
    items.push(spawn(nextId, nextSpawn))
    nextId += 1
    nextSpawn += RUN.spawnEvery
  }

  const justCollected: number[] = []
  let collected = state.collected
  let bigCollected = state.bigCollected

  const kept = items.filter((item) => {
    const reached = Math.abs(item.z - RUN.playerZ) <= RUN.pickupDepth
    if (reached && Math.abs(item.x - playerX) <= RUN.pickupRadius) {
      justCollected.push(item.id)
      collected += 1
      if (item.big) bigCollected += 1
      return false
    }
    // Past the runner and missed: drop it once it is behind the camera.
    return item.z < RUN.despawnZ
  })

  return { t, playerX, items: kept, collected, bigCollected, nextSpawn, nextId, justCollected }
}

/**
 * Where a star appears. Positions walk across the lane rather than being drawn
 * independently, so the child gets *runs* of stars to sweep up instead of an
 * even scatter they can stand still for.
 */
function spawn(id: number, at: number): Collectible {
  const wave = Math.sin(at * 1.7) + Math.sin(at * 0.6) * 0.6
  const x = clamp((wave / 1.6) * RUN.laneHalfWidth, -RUN.laneHalfWidth, RUN.laneHalfWidth)
  // Every so often, a golden one.
  const big = id % RUN.bigEvery === 0
  return { id, x, z: RUN.spawnZ, big }
}

/** Speed-capped sideways movement, same feel as the keeper mode. */
export function stepRunner(current: number, wantedX: number, dt: number): number {
  const wanted = clamp(wantedX, -RUN.laneHalfWidth - 0.6, RUN.laneHalfWidth + 0.6)
  const maxStep = RUN.playerSpeed * dt
  const delta = wanted - current
  if (Math.abs(delta) <= maxStep) return wanted
  return current + Math.sign(delta) * maxStep
}

/**
 * Stars for a finished run. **Never zero**, exactly like the other two modes.
 * Golden stars count double, so a child who chases them is rewarded without
 * anyone having to explain that they are worth more.
 */
export function starsForRun(collected: number, big: number): number {
  const score = collected + big
  if (score >= RUN.threeStarScore) return 3
  if (score >= RUN.twoStarScore) return 2
  return 1
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}
