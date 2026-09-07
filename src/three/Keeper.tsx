import type { RefObject } from 'react'
import * as THREE from 'three'
import type { Keeper as KeeperData } from '../data/keepers'
import { Dragon } from './Dragon'
import { Griffin } from './Griffin'
import { Unicorn } from './Unicorn'
import { Yeti } from './Yeti'

/**
 * The single entry point for drawing whoever is in goal.
 *
 * Both mini-games render this and never learn which species they got — the
 * shooting mode does not know who is keeping, and the keeping mode does not
 * know who is shooting at it. Adding a fifth keeper is a branch here, a
 * component beside it, and an entry in `data/keepers.ts`.
 *
 * Every species is modelled facing **+z**, towards the camera and the shooter.
 * Keeping mode turns the whole group round rather than each species knowing
 * which way it is playing.
 */
export function Keeper({ data, ref }: { data: KeeperData; ref?: RefObject<THREE.Group | null> }) {
  return (
    <group ref={ref} scale={1.15}>
      <Species data={data} />
    </group>
  )
}

function Species({ data }: { data: KeeperData }) {
  switch (data.kind) {
    case 'dragon':
      return <Dragon data={data} />
    case 'unicorn':
      return <Unicorn data={data} />
    case 'griffin':
      return <Griffin data={data} />
    case 'yeti':
      return <Yeti data={data} />
  }
}
