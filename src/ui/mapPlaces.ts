import type { GameMode } from '../store/gameStore'
import type { TranslationKey } from '../i18n/translations'

/**
 * Where each mini-game lives on the Carte du Royaume.
 *
 * Plain data, deliberately kept out of the component: these numbers decide
 * whether two 72px medallions land on top of each other on a 320px-wide phone,
 * and that is a question a test can answer without a browser.
 */

/** The map's own coordinate system; the SVG and the medallions share it. */
export const MAP = {
  width: 360,
  height: 320,
  /** Diameter of a place's medallion. Rule 4: nothing a child taps is under 64px. */
  medallion: 72,
  /** Room the name plate under a medallion needs, wrapped to two lines. */
  labelWidth: 130,
  labelHeight: 38,
} as const

export interface Place {
  mode: GameMode
  labelKey: TranslationKey
  /** Centre of the medallion. */
  x: number
  y: number
  /** Fill of the medallion, so the four places differ by colour as well as icon. */
  tint: string
}

/**
 * The badges, shared with the cup banner. A child who has seen 🥅🧤⭐🧱 on the
 * cup button has already been told which four places it visits, so the two must
 * never drift apart.
 */
export const MODE_BADGES: Record<GameMode, string> = {
  shoot: '🥅',
  keep: '🧤',
  run: '⭐',
  tower: '🧱',
}

/**
 * In the cup's running order: the dashed road on the map is the route the
 * Coupe du Royaume takes, which is how the cup gets explained without words.
 * `mapPlaces.test.ts` holds the two in step.
 */
export const PLACES: Place[] = [
  { mode: 'shoot', labelKey: 'mode.shoot', x: 95, y: 80, tint: '#2f8f43' },
  { mode: 'keep', labelKey: 'mode.keep', x: 262, y: 124, tint: '#2a6fb5' },
  { mode: 'run', labelKey: 'mode.run', x: 88, y: 204, tint: '#b5791a' },
  { mode: 'tower', labelKey: 'mode.tower', x: 258, y: 240, tint: '#6b5f85' },
]
