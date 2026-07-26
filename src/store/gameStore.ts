import { create } from 'zustand'
import { ROUND } from '../game/constants'
import type { ShotOutcome } from '../game/scoring'
import { starsFor } from '../game/scoring'
import { starsForSaves } from '../game/keeperGame'
import { starsForRun } from '../game/runGame'

export type Screen = 'home' | 'wardrobe' | 'play' | 'result'

/** Which mini-game the round is playing. */
export type GameMode = 'shoot' | 'keep' | 'run'

/** Everything that can be shouted after an attempt, across both modes. */
export type RoundOutcome = ShotOutcome | 'saved' | 'conceded'

export interface GameState {
  screen: Screen
  mode: GameMode
  shotsTaken: number
  /** Successes: goals scored in `shoot`, saves made in `keep`. */
  goals: number
  bonuses: number
  /** Result of the attempt just finished, shown as a big shout. */
  lastOutcome: RoundOutcome | null
  /** Bumped every attempt so the shout re-animates even on a repeat outcome. */
  shoutId: number
  /** Stars awarded by the round that just ended. */
  earnedStars: number
  /**
   * Whether the round has finished. Explicit rather than derived from
   * `shotsTaken`, because the runner mini-game ends on a clock instead of on a
   * count of attempts.
   */
  roundOver: boolean

  goHome: () => void
  goWardrobe: () => void
  startRound: (mode: GameMode) => void
  finishRound: () => void
  recordShot: (outcome: ShotOutcome, target: string | null) => void
  recordSave: (saved: boolean) => void
  collectStar: (big: boolean) => void
  finishRun: (collected: number, big: number) => void
  clearShout: () => void
}

const emptyRound = {
  shotsTaken: 0,
  goals: 0,
  bonuses: 0,
  lastOutcome: null,
  shoutId: 0,
  earnedStars: 0,
  roundOver: false,
}

export const useGame = create<GameState>((set, get) => ({
  screen: 'home',
  mode: 'shoot',
  ...emptyRound,

  goHome: () => set({ screen: 'home', ...emptyRound }),
  goWardrobe: () => set({ screen: 'wardrobe' }),
  startRound: (mode) => set({ screen: 'play', mode, ...emptyRound }),
  finishRound: () => set({ screen: 'result' }),

  recordShot: (outcome, target) => {
    const s = get()
    const shotsTaken = s.shotsTaken + 1
    const goals = s.goals + (outcome === 'goal' ? 1 : 0)
    const bonuses = s.bonuses + (target ? 1 : 0)
    const finished = shotsTaken >= ROUND.shotsPerRound

    set({
      shotsTaken,
      goals,
      bonuses,
      lastOutcome: outcome,
      shoutId: s.shoutId + 1,
      // The round result is computed here, at the moment the last attempt
      // lands, so the result screen is a pure read of already-settled state.
      earnedStars: finished ? starsFor(goals, bonuses) : 0,
      roundOver: finished,
    })
  },

  recordSave: (saved) => {
    const s = get()
    const shotsTaken = s.shotsTaken + 1
    const goals = s.goals + (saved ? 1 : 0)
    const finished = shotsTaken >= ROUND.shotsPerRound

    set({
      shotsTaken,
      goals,
      lastOutcome: saved ? 'saved' : 'conceded',
      shoutId: s.shoutId + 1,
      earnedStars: finished ? starsForSaves(goals, ROUND.shotsPerRound) : 0,
      roundOver: finished,
    })
  },

  collectStar: (big) => {
    const s = get()
    set({ goals: s.goals + 1, bonuses: s.bonuses + (big ? 1 : 0) })
  },

  finishRun: (collected, big) =>
    set({ goals: collected, bonuses: big, earnedStars: starsForRun(collected, big), roundOver: true }),

  clearShout: () => set({ lastOutcome: null }),
}))

/** i18n key for the big shout after an attempt, in either mode. */
export function shoutKeyFor(outcome: RoundOutcome) {
  switch (outcome) {
    case 'goal':
      return 'shout.goal' as const
    case 'save':
      return 'shout.save' as const
    case 'post':
      return 'shout.post' as const
    case 'saved':
      return 'shout.saved' as const
    case 'conceded':
      return 'shout.conceded' as const
    default:
      return 'shout.miss' as const
  }
}
