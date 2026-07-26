/**
 * Where a round is played.
 *
 * A stadium is nothing but a palette — the pitch, castle and stands are the
 * same geometry every time. That is the whole point: a new place to play costs
 * an entry in this file and no new meshes, and it gives the star economy
 * something to hand out that changes the *look* of the game rather than adding
 * another thing to manage.
 */

export interface Stadium {
  id: string
  /** Emoji shown on the picker card, so the UI needs no reading. */
  badge: string
  /** CSS gradient behind the transparent canvas. */
  sky: string
  /** The two mown stripe colours. */
  grassLight: string
  grassDark: string
  /** Blob-shadow tint; it has to sit on the ground colour, not on green. */
  shadow: string
  castleWall: string
  castleTower: string
  /** Roofs alternate: the tall towers take the first colour. */
  castleRoofTall: string
  castleRoofShort: string
  standLeft: string
  standRight: string
  standBack: string
  /** Net tint behind the goal. */
  net: string
  /** Lifetime stars needed. 0 = available from the very first launch. */
  unlockStars: number
}

export const STADIUMS: Stadium[] = [
  {
    id: 'prairie',
    badge: '🌳',
    sky: 'linear-gradient(180deg, #7fd1ff 0%, #c9e9ff 45%, #ffe6f4 100%)',
    grassLight: '#63c86b',
    grassDark: '#57bb60',
    shadow: '#2f7a3a',
    castleWall: '#cdb0ea',
    castleTower: '#e3ccf7',
    castleRoofTall: '#db2777',
    castleRoofShort: '#a855f7',
    standLeft: '#c58cff',
    standRight: '#8cd0ff',
    standBack: '#ff9ed2',
    net: '#ffd9f0',
    unlockStars: 0,
  },
  {
    id: 'plage',
    badge: '🏖️',
    sky: 'linear-gradient(180deg, #ffb46b 0%, #ffd9a0 40%, #ffeccd 100%)',
    grassLight: '#f2dfa8',
    grassDark: '#e8d094',
    shadow: '#a8894a',
    castleWall: '#ffd9b0',
    castleTower: '#fff0dc',
    castleRoofTall: '#ff7043',
    castleRoofShort: '#ffa726',
    standLeft: '#4dd0c4',
    standRight: '#7fdcff',
    standBack: '#ffb59e',
    net: '#ffe0c4',
    unlockStars: 6,
  },
  {
    id: 'glaces',
    badge: '❄️',
    sky: 'linear-gradient(180deg, #9fd8ff 0%, #d6f0ff 45%, #ffffff 100%)',
    grassLight: '#e8f6ff',
    grassDark: '#d3ecfb',
    shadow: '#7fa8c4',
    castleWall: '#bfe3f7',
    castleTower: '#ecf9ff',
    castleRoofTall: '#4aa3d8',
    castleRoofShort: '#7fc7ea',
    standLeft: '#a8d8f0',
    standRight: '#c9e9ff',
    standBack: '#e0f2ff',
    net: '#dff0fb',
    unlockStars: 12,
  },
  {
    id: 'nuit',
    badge: '🌙',
    sky: 'linear-gradient(180deg, #241a52 0%, #4a2c84 45%, #8a4fb0 100%)',
    grassLight: '#2f7a52',
    grassDark: '#276745',
    shadow: '#123322',
    castleWall: '#4a3a75',
    castleTower: '#6a5599',
    castleRoofTall: '#ffd84d',
    castleRoofShort: '#c07bff',
    standLeft: '#5b3f8f',
    standRight: '#3f5b8f',
    standBack: '#7a4f9e',
    net: '#b9a6e0',
    unlockStars: 20,
  },
]

export function stadiumById(id: string): Stadium {
  return STADIUMS.find((s) => s.id === id) ?? STADIUMS[0]
}
