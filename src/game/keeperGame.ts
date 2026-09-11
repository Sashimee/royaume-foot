import { KEEP, PHYSICS, PITCH } from './constants'
import type { Vec3 } from './physics'

/**
 * Rules for the "Gardienne du château" mode, where the child *is* the keeper.
 *
 * Ball flight here is analytic rather than integrated: the shot is defined by
 * where it will cross the goal line, and `ballPosAt` interpolates to exactly
 * that point. That matters — the target ring shown during the wind-up promises
 * the child a landing spot, and drag or bounce error would make the game lie.
 */

export interface Attempt {
  /** Where the ball crosses the goal line. */
  targetX: number
  targetY: number
  /** Where the dragon strikes from. */
  fromX: number
}

/** Deterministic given the same generator — keeps rounds reproducible in tests. */
export function makeAttempt(rand: () => number): Attempt {
  const spread = PITCH.goalHalfWidth * KEEP.aimSpread
  const targetX = (rand() * 2 - 1) * spread
  const targetY = KEEP.aimMinY + rand() * (KEEP.aimMaxY - KEEP.aimMinY)
  // Always to one side, never dead centre — a shooter on the centre line sits
  // between the camera and the goal and hides both the ball and the telegraph.
  const side = rand() < 0.5 ? -1 : 1
  const fromX = side * (KEEP.shooterMinX + rand() * KEEP.shooterSideSpread)
  return { targetX, targetY, fromX }
}

const START_Y = PITCH.ballRadius

/** Ball position `t` seconds after the kick. */
export function ballPosAt(attempt: Attempt, t: number): Vec3 {
  const T = KEEP.flightTime
  const from = { x: attempt.fromX, y: START_Y, z: KEEP.shooterZ }

  const vx = (attempt.targetX - from.x) / T
  const vz = (PITCH.goalZ - from.z) / T
  // Solve for the launch speed that puts the ball exactly on target at t = T.
  const vy = (attempt.targetY - from.y - 0.5 * PHYSICS.gravity * T * T) / T

  return {
    x: from.x + vx * t,
    y: from.y + vy * t + 0.5 * PHYSICS.gravity * t * t,
    z: from.z + vz * t,
  }
}

/**
 * Moves the player's keeper towards where the finger is, capped by her top
 * speed. The cap is what makes this a game rather than a teleport — but it is
 * set high enough that she can always cross the whole goal within one wind-up.
 */
export function stepPlayerKeeper(current: number, targetX: number, dt: number): number {
  const limit = PITCH.goalHalfWidth - 0.15
  const wanted = clamp(targetX, -limit, limit)
  const maxStep = KEEP.maxSpeed * dt
  const delta = wanted - current
  if (Math.abs(delta) <= maxStep) return wanted
  return current + Math.sign(delta) * maxStep
}

/** Did she get it? */
export function isSave(attempt: Attempt, keeperX: number): boolean {
  if (attempt.targetY > KEEP.reachHeight) return false
  return Math.abs(attempt.targetX - keeperX) <= KEEP.reach
}

/**
 * Stars for a keeping round. Same promise as the shooting mode: **never zero**.
 */
export function starsForSaves(saves: number, shots: number): number {
  if (saves >= shots) return 3
  if (saves >= Math.ceil(shots * 0.6)) return 2
  return 1
}

/** A small deterministic generator, so a seeded round replays identically. */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

/**
 * The wind-up → flight → settle cycle one attempt goes through.
 *
 * This lives here rather than in the scene because it is what decides when the
 * shot is judged, and because the bug below is invisible in the source and
 * obvious in a test.
 */
export type KeepPhase = 'windup' | 'flight' | 'settle'

export interface AttemptClock {
  phase: KeepPhase
  /** Seconds spent in the current phase. */
  t: number
  /**
   * Seconds since the kick, which keeps running through `settle` — unlike the
   * phase timer, which resets at every transition. Driving the ball from the
   * phase timer teleported it back to the shooter's feet the instant the shot
   * was judged and flew the whole shot a second time, underneath a verdict the
   * child had already been given.
   */
  sinceKick: number
}

/** What the clock just did, for the scene to react to. */
export type AttemptEvent = 'kick' | 'judged' | 'rearm' | null

export function makeAttemptClock(): AttemptClock {
  return { phase: 'windup', t: 0, sinceKick: 0 }
}

/**
 * Advances the clock by `dt`. `held` freezes the wind-up, so no new shot is
 * ever taken behind a result panel.
 */
export function stepAttemptClock(
  clock: AttemptClock,
  dt: number,
  held: boolean,
): { clock: AttemptClock; event: AttemptEvent } {
  const t = clock.t + dt
  const sinceKick = clock.phase === 'windup' ? 0 : clock.sinceKick + dt

  if (clock.phase === 'windup' && t >= KEEP.windUp && !held) {
    return { clock: { phase: 'flight', t: 0, sinceKick: 0 }, event: 'kick' }
  }
  if (clock.phase === 'flight' && t >= KEEP.flightTime) {
    return { clock: { phase: 'settle', t: 0, sinceKick }, event: 'judged' }
  }
  if (clock.phase === 'settle' && t >= KEEP.settle) {
    return { clock: makeAttemptClock(), event: 'rearm' }
  }
  return { clock: { phase: clock.phase, t, sinceKick }, event: null }
}

/**
 * How far into its flight the ball should be drawn, in seconds.
 *
 * It carries on past the goal line rather than stopping on it, so the ball is
 * visibly in the net, and then holds there for the rest of the settle.
 */
export function ballFlightTime(clock: AttemptClock): number {
  if (clock.phase === 'windup') return 0
  return Math.min(clock.sinceKick, KEEP.flightTime * KEEP.followThrough)
}
