import { describe, expect, it } from 'vitest'
import { CUP } from './constants'
import { CUP_LEGS, cupIsComplete, cupTotals, legMode, trophyGrade } from './cup'

describe('cup', () => {
  it('plays every mini-game exactly once', () => {
    expect(new Set(CUP_LEGS).size).toBe(CUP_LEGS.length)
    expect(CUP_LEGS).toContain('shoot')
    expect(CUP_LEGS).toContain('keep')
    expect(CUP_LEGS).toContain('run')
    expect(CUP_LEGS).toContain('tower')
  })

  it('opens with the mode everybody already knows', () => {
    // A cup that starts on the least familiar game loses the child on leg one.
    expect(legMode(0)).toBe('shoot')
  })

  it('is only complete once every leg has been played', () => {
    expect(cupIsComplete([])).toBe(false)
    expect(cupIsComplete([3, 3, 3])).toBe(false)
    expect(cupIsComplete([1, 1, 1, 1])).toBe(true)
  })

  it('pays the finish bonus only at the end', () => {
    expect(cupTotals([3, 3, 3]).finish).toBe(0)
    expect(cupTotals([1, 1, 1, 1]).finish).toBe(CUP.finishBonus)
  })

  it('pays the perfect bonus only for three stars in every leg', () => {
    expect(cupTotals([3, 3, 3, 2]).perfect).toBe(0)
    expect(cupTotals([3, 3, 3, 3]).perfect).toBe(CUP.perfectBonus)
  })

  it('is always worth more than playing the legs separately', () => {
    // Otherwise the cup is a longer way to earn the same stars, and no child
    // would choose it twice.
    const legs = [2, 1, 3, 2]
    const apart = legs.reduce((a, b) => a + b, 0)
    expect(cupTotals(legs).total).toBeGreaterThan(apart)
  })

  it('keeps the stars an abandoned cup already earned, and no bonus', () => {
    const partial = cupTotals([3, 2])
    expect(partial.legs).toBe(5)
    expect(partial.total).toBe(5)
  })

  it('never awards less than one trophy for finishing', () => {
    // Rule 3 again: finishing four mini-games is the achievement, whatever the
    // scoreline said along the way.
    expect(trophyGrade([1, 1, 1, 1])).toBe(1)
  })

  it('gives three trophies only for a flawless cup', () => {
    expect(trophyGrade([3, 3, 3, 3])).toBe(3)
    expect(trophyGrade([3, 3, 3, 2])).toBe(2)
  })

  it('never asks for a leg that does not exist', () => {
    expect(legMode(CUP_LEGS.length + 5)).toBe(CUP_LEGS[CUP_LEGS.length - 1])
  })
})
