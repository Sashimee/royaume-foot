/**
 * The little companion that trots alongside the player.
 *
 * A mascot changes nothing about the rules — it is pure company. That is the
 * point: at this age a pet that follows you around is a reason to keep playing
 * all by itself, and it costs the child nothing to understand.
 */

export interface Mascot {
  id: string
  /** Emoji shown on the picker card, so the UI needs no reading. */
  badge: string
  /** Which extra bits get drawn; the body underneath is shared. */
  kind: 'cat' | 'bunny' | 'unicorn' | 'dragonling'
  body: string
  belly: string
  accent: string
  /** Lifetime stars needed. 0 = available from the very first launch. */
  unlockStars: number
}

export const MASCOTS: Mascot[] = [
  { id: 'chat', badge: '🐱', kind: 'cat', body: '#ffb35c', belly: '#fff1c9', accent: '#ff8ac0', unlockStars: 0 },
  { id: 'lapin', badge: '🐰', kind: 'bunny', body: '#f6e6f7', belly: '#ffffff', accent: '#ff9ec4', unlockStars: 5 },
  { id: 'licorne', badge: '🦄', kind: 'unicorn', body: '#ffffff', belly: '#ffeaf7', accent: '#c07bff', unlockStars: 11 },
  { id: 'dragonnet', badge: '🐲', kind: 'dragonling', body: '#7fd88f', belly: '#e8f9c9', accent: '#ffd84d', unlockStars: 18 },
]

export function mascotById(id: string): Mascot {
  return MASCOTS.find((m) => m.id === id) ?? MASCOTS[0]
}
