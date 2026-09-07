/**
 * Who stands in the goal.
 *
 * The keeper used to be one hard-coded dragon, which made him the only face a
 * child ever saw in shooting mode and the only striker in keeping mode. A
 * playtest said as much. He is now an entry here plus a component per species,
 * exactly like the playable roster — the mini-games ask for "the keeper" and
 * never learn which one they got.
 *
 * Names are proper nouns and stay untranslated, like the characters.
 */

export interface Keeper {
  id: string
  name: string
  /** Emoji shown on the picker card, so the UI needs no reading. */
  badge: string
  /** Which component draws it. One per species — see three/Keeper.tsx. */
  kind: 'dragon' | 'unicorn' | 'griffin' | 'yeti'
  /** Main body colour. */
  body: string
  /** Shading colour for limbs and muzzle — a flat body reads as a blob. */
  bodyDark: string
  /** The light band down the front, which is what separates front from back. */
  belly: string
  /** Horns, hooves, beak, claws: the hard bits. */
  accent: string
  /** Wing membrane, mane, feathers, fur trim — the soft, large-area bits. */
  trim: string
  /** Lifetime stars needed. 0 = available from the very first launch. */
  unlockStars: number
}

export const KEEPERS: Keeper[] = [
  {
    id: 'braise',
    name: 'Braise',
    badge: '🐲',
    kind: 'dragon',
    body: '#6fce84',
    bodyDark: '#4fa866',
    belly: '#f4f7c9',
    accent: '#ffd84d',
    trim: '#b8ecc4',
    unlockStars: 0,
  },
  {
    id: 'etoile',
    name: 'Étoile',
    badge: '🦄',
    kind: 'unicorn',
    body: '#ffffff',
    bodyDark: '#e7dbf3',
    belly: '#ffeaf7',
    accent: '#ffd84d',
    trim: '#c07bff',
    unlockStars: 7,
  },
  {
    id: 'plume',
    name: 'Plume',
    badge: '🦅',
    kind: 'griffin',
    body: '#e8b95c',
    bodyDark: '#c9954a',
    belly: '#fff1c9',
    accent: '#ffd84d',
    trim: '#a6552f',
    unlockStars: 13,
  },
  {
    id: 'flocon',
    name: 'Flocon',
    badge: '❄️',
    kind: 'yeti',
    body: '#eaf6ff',
    bodyDark: '#c6dced',
    belly: '#ffffff',
    accent: '#7bd3ff',
    trim: '#9ec9ff',
    unlockStars: 20,
  },
]

export function keeperById(id: string): Keeper {
  return KEEPERS.find((k) => k.id === id) ?? KEEPERS[0]
}
