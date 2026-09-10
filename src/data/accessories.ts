/**
 * One thing worn on top of whoever is playing.
 *
 * There is a single slot, not one per body part, because every extra slot is
 * another decision between a child and the pitch. What it *is* varies — some
 * are worn on the head, some on the back — so the item carries its own mount
 * and the character reads it off the data.
 *
 * An accessory **replaces** what the character already wears at that mount:
 * the princess's crown, the knight's plume, the knight's cape. That keeps the
 * roster's discriminated union intact — nothing here is ever added to a
 * `Princess` or a `Knight` as a field, so a princess still cannot be given a
 * plume.
 */

export interface Accessory {
  id: string
  /** Emoji shown on the picker card, so the UI needs no reading. */
  badge: string
  /** Where it is worn; `none` is the empty slot and hides nothing. */
  mount: 'head' | 'back' | 'none'
  /** Which shape gets drawn. The body underneath is the character's own. */
  kind: 'none' | 'fairy' | 'flowers' | 'butterfly' | 'crown' | 'cape' | 'tiara' | 'dragon' | 'party'
  main: string
  accent: string
  /** Lifetime stars needed. 0 = available from the very first launch. */
  unlockStars: number
}

/**
 * Ordered by price, and the ladder deliberately runs past the old top of the
 * game (22 stars, the cake ball): a child who has unlocked everything has
 * nothing left to play *for*, and rule 5 makes the wardrobe the reward loop.
 * Head and back items alternate so the next thing to want is never two of the
 * same silhouette in a row.
 */
export const ACCESSORIES: Accessory[] = [
  { id: 'rien', badge: '⭕', mount: 'none', kind: 'none', main: '#ffffff', accent: '#ffffff', unlockStars: 0 },
  { id: 'ailes-fee', badge: '🧚', mount: 'back', kind: 'fairy', main: '#ffb3e6', accent: '#fff1c9', unlockStars: 4 },
  { id: 'couronne-fleurs', badge: '🌸', mount: 'head', kind: 'flowers', main: '#ff9ec4', accent: '#ffe27a', unlockStars: 8 },
  { id: 'ailes-papillon', badge: '🦋', mount: 'back', kind: 'butterfly', main: '#7bd4ff', accent: '#c58cff', unlockStars: 12 },
  { id: 'grande-couronne', badge: '👑', mount: 'head', kind: 'crown', main: '#ffd84d', accent: '#ff6f9c', unlockStars: 16 },
  { id: 'cape-etoilee', badge: '🦸', mount: 'back', kind: 'cape', main: '#5b3ba1', accent: '#ffe27a', unlockStars: 19 },
  { id: 'diademe', badge: '🌟', mount: 'head', kind: 'tiara', main: '#dff3ff', accent: '#3aa9ff', unlockStars: 23 },
  { id: 'ailes-dragon', badge: '🐉', mount: 'back', kind: 'dragon', main: '#6fc47f', accent: '#377a4e', unlockStars: 27 },
  { id: 'chapeau-fete', badge: '🎉', mount: 'head', kind: 'party', main: '#ff7bc0', accent: '#ffd84d', unlockStars: 31 },
]

export function accessoryById(id: string): Accessory {
  return ACCESSORIES.find((a) => a.id === id) ?? ACCESSORIES[0]
}

/** True when the character's own crown / plume / cape must give way to this. */
export function replaces(accessory: Accessory, mount: 'head' | 'back'): boolean {
  return accessory.mount === mount
}
