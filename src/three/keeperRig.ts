import { createContext, useContext, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from './reducedMotion'

/**
 * Seconds of celebratory wave the keeper still owes the child.
 *
 * A ref rather than state, and a context rather than a prop, for two reasons:
 * the match loop sets it from inside `useFrame` and must not re-render the
 * scene to do it, and routing it as a prop would mean every species learning
 * about a gesture that is deliberately shared between all four.
 */
export const KeeperCheerContext = createContext<RefObject<number> | null>(null)

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
  const cheer = useContext(KeeperCheerContext)

  useFrame((state, delta) => {
    // The wave the child gets when a shot did not go in. Rule 3 of the project
    // has always promised this ("a missed shot bounces back and the keeper
    // waves") and for four releases he simply leaned and went back to work.
    //
    // It runs even under `prefers-reduced-motion`, unlike everything below it:
    // this is not idle charm, it is the feedback that stops a miss reading as
    // a failure, and a still keeper after a miss is exactly the punishment the
    // rule exists to prevent.
    if (cheer && cheer.current > 0) {
      cheer.current = Math.max(0, cheer.current - delta)
      const t = state.clock.elapsedTime
      if (rig.limbR.current) rig.limbR.current.rotation.z = 0.85 + Math.sin(t * 13) * 0.35
      if (rig.limbL.current) rig.limbL.current.rotation.z = 0.35
      if (rig.head.current) {
        rig.head.current.rotation.x = 0
        rig.head.current.rotation.y = Math.sin(t * 6.5) * 0.16
      }
      if (rig.body.current) rig.body.current.position.y = Math.abs(Math.sin(t * 6.5)) * 0.07
      return
    }

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
