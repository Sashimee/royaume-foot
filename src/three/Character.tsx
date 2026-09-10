import { Knight } from './Knight'
import { Princess } from './Princess'
import type { Character as CharacterData } from '../data/roster'
import type { Accessory as AccessoryData } from '../data/accessories'
import type { CharacterMode } from './characterRig'

/**
 * The single entry point for drawing whoever the child is playing as.
 *
 * Everything else in the game — both mini-games, the menu, the wardrobe —
 * renders this and never learns which kind it got. Adding a third character
 * type means a new branch here and nowhere else.
 */
export function Character(props: {
  data: CharacterData
  accessory: AccessoryData
  mode?: CharacterMode
  showcase?: boolean
  position?: [number, number, number]
  facing?: number
  spinToCelebrate?: boolean
}) {
  const { data, ...rest } = props
  return data.kind === 'knight' ? <Knight data={data} {...rest} /> : <Princess data={data} {...rest} />
}
