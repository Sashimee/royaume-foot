import { useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from './reducedMotion'

export interface KeeperRigRefs {
  body: RefObject<THREE.Group | null>
  head: RefObject<THREE.Group | null>
  limbL: RefObject<THREE.Group | null>
  limbR: RefObject<THREE.Group | null>
  tail: RefObject<THREE.Group | null>
}

export interface KeeperRigOptions {
  /**
   * How far the side limbs beat, in radians. Wings want a wide flap; arms and
   * ears want a small sway. Zero pins them still.
   */
  limbSwing: number
  /** Beats per second of that swing. */
  limbSpeed?: number
}

/**
 * The shared idle life of whoever is in goal.
 *
 * Every species breathes, lets its head lag behind its body and sways its tail
 * — that lag is most of what sells "alive", and duplicating it per species is
 * how four keepers would end up moving in four subtly different ways. The
 * match loop owns `position` and the dive lean on the group *above* this; this
 * hook never touches either.
 */
export function useKeeperRig(rig: KeeperRigRefs, { limbSwing, limbSpeed = 4 }: KeeperRigOptions) {
  const reduced = useReducedMotion()

  useFrame((state) => {
    // Every line below is idle charm, so all of it goes. The keeper still moves
    // where the match loop puts them, and still dives.
    if (reduced) {
      if (rig.limbL.current) rig.limbL.current.rotation.z = 0.35
      if (rig.limbR.current) rig.limbR.current.rotation.z = -0.35
      return
    }
    const t = state.clock.elapsedTime
    const beat = Math.sin(t * limbSpeed) * limbSwing

    if (rig.limbL.current) rig.limbL.current.rotation.z = 0.35 + beat
    if (rig.limbR.current) rig.limbR.current.rotation.z = -0.35 - beat
    if (rig.body.current) rig.body.current.position.y = Math.sin(t * 2.2) * 0.045
    if (rig.head.current) {
      rig.head.current.rotation.x = Math.sin(t * 2.2 - 0.5) * 0.07
      rig.head.current.rotation.y = Math.sin(t * 0.7) * 0.18
    }
    if (rig.tail.current) rig.tail.current.rotation.y = Math.sin(t * 1.6) * 0.22
  })
}

export function useKeeperRigRefs(): KeeperRigRefs {
  return {
    body: useRef<THREE.Group>(null),
    head: useRef<THREE.Group>(null),
    limbL: useRef<THREE.Group>(null),
    limbR: useRef<THREE.Group>(null),
    tail: useRef<THREE.Group>(null),
  }
}
