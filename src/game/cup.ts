import { CUP } from './constants'

/**
 * "Coupe du Royaume" — the four mini-games back to back, then a trophy.
 *
 * The cup is a *frame* around the modes, not a fifth game: each leg is played
 * exactly as it is played on its own, with its own rules and its own stars.
 * All this module does is add them up and decide what the trophy is worth.
 *
 * There is no way to fail out. A leg that goes badly still earns its floor of
 * one star and still advances, because the cup has to be finishable by the
 * child who most wants to finish it.
 */

export type CupLeg = (typeof CUP.legs)[number]

export const CUP_LEGS: readonly CupLeg[] = CUP.legs

export interface CupTotals {
  /** Stars earned by the legs themselves. */
  legs: number
  /** Bonus for reaching the end at all. */
  finish: number
  /** Extra for three stars in every leg. */
  perfect: number
  total: number
}

export function cupIsComplete(legStars: readonly number[]): boolean {
  return legStars.length >= CUP_LEGS.length
}

/** Which mini-game the given leg plays. */
export function legMode(leg: number): CupLeg {
  return CUP_LEGS[Math.min(leg, CUP_LEGS.length - 1)]
}

/**
 * What the cup pays out. Only complete cups earn the bonuses — an abandoned
 * run keeps the stars its legs already banked and nothing more.
 */
export function cupTotals(legStars: readonly number[]): CupTotals {
  const legs = legStars.reduce((sum, n) => sum + n, 0)
  const done = cupIsComplete(legStars)
  const perfect = done && legStars.every((n) => n >= 3)

  const finish = done ? CUP.finishBonus : 0
  const perfectBonus = perfect ? CUP.perfectBonus : 0

  return { legs, finish, perfect: perfectBonus, total: legs + finish + perfectBonus }
}

/**
 * How many trophies to show on the end screen: three for a perfect cup, two for
 * a strong one, one for finishing. Never zero — finishing *is* the achievement.
 */
export function trophyGrade(legStars: readonly number[]): 1 | 2 | 3 {
  const { legs } = cupTotals(legStars)
  const most = CUP_LEGS.length * 3
  if (legs >= most) return 3
  if (legs >= most - CUP_LEGS.length) return 2
  return 1
}
