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
