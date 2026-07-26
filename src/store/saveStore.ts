import { create } from 'zustand'
import { BALLS, CHARACTERS } from '../data/roster'
import { STADIUMS } from '../data/stadiums'
import { MASCOTS } from '../data/mascots'

const KEY = 'royaume-foot:save:v1'

export interface SaveState {
  /** Lifetime stars. Never spent — see the note on unlocking below. */
  stars: number
  characterId: string
  ballId: string
  stadiumId: string
  mascotId: string
  muted: boolean
  addStars: (n: number) => void
  setCharacter: (id: string) => void
  setBall: (id: string) => void
  setStadium: (id: string) => void
  setMascot: (id: string) => void
  toggleMute: () => void
  /** Wipe progress and every choice, back to a first-launch state. */
  reset: () => void
}

interface Persisted {
  stars: number
  characterId: string
  ballId: string
  stadiumId: string
  mascotId: string
  muted: boolean
}

function load(): Persisted {
  const fallback: Persisted = {
    stars: 0,
    characterId: CHARACTERS[0].id,
    ballId: BALLS[0].id,
    stadiumId: STADIUMS[0].id,
    mascotId: MASCOTS[0].id,
    muted: false,
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<Persisted> & { princessId?: string }
    return {
      stars: typeof parsed.stars === 'number' && parsed.stars >= 0 ? parsed.stars : 0,
      // Guard against a save written by an older build that named things we no
      // longer ship, otherwise the child boots into an empty wardrobe.
      // `princessId` is the field name from the first release, before knights
      // existed. Reading it keeps a child's chosen character (and their whole
      // save) across the upgrade instead of silently resetting them.
      characterId: CHARACTERS.some((c) => c.id === (parsed.characterId ?? parsed.princessId))
        ? (parsed.characterId ?? parsed.princessId)!
        : fallback.characterId,
      ballId: BALLS.some((b) => b.id === parsed.ballId) ? parsed.ballId! : fallback.ballId,
      stadiumId: STADIUMS.some((s) => s.id === parsed.stadiumId) ? parsed.stadiumId! : fallback.stadiumId,
      mascotId: MASCOTS.some((m) => m.id === parsed.mascotId) ? parsed.mascotId! : fallback.mascotId,
      muted: parsed.muted === true,
    }
  } catch {
    // Private mode, disabled storage, corrupt JSON — the game must still run.
    return fallback
  }
}

function persist(state: Persisted) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Progress simply won't survive a reload. Not worth interrupting play.
  }
}

export const useSave = create<SaveState>((set, get) => ({
  ...load(),
  addStars: (n) => {
    set({ stars: get().stars + n })
    save(get)
  },
  setCharacter: (id) => {
    set({ characterId: id })
    save(get)
  },
  setBall: (id) => {
    set({ ballId: id })
    save(get)
  },
  setStadium: (id) => {
    set({ stadiumId: id })
    save(get)
  },
  setMascot: (id) => {
    set({ mascotId: id })
    save(get)
  },
  reset: () => {
    set({
      stars: 0,
      characterId: CHARACTERS[0].id,
      ballId: BALLS[0].id,
      stadiumId: STADIUMS[0].id,
      mascotId: MASCOTS[0].id,
    })
    save(get)
  },
  toggleMute: () => {
    set({ muted: !get().muted })
    save(get)
  },
}))

function save(get: () => SaveState) {
  const { stars, characterId, ballId, stadiumId, mascotId, muted } = get()
  persist({ stars, characterId, ballId, stadiumId, mascotId, muted })
}

/**
 * Unlocks are **thresholds, not purchases**. A 6-year-old handling a currency
 * ("do I spend 5 stars now or save for 12?") is a chore; things simply
 * appearing as they play is a gift. Nothing is ever taken away.
 */
export function isUnlocked(unlockStars: number, stars: number): boolean {
  return stars >= unlockStars
}
