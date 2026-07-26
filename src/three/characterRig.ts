import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export type CharacterMode = 'idle' | 'kick' | 'celebrate'

export interface Rig {
  root: RefObject<THREE.Group | null>
  legL: RefObject<THREE.Group | null>
  legR: RefObject<THREE.Group | null>
  armL: RefObject<THREE.Group | null>
  armR: RefObject<THREE.Group | null>
}

export interface RigOptions {
  mode: CharacterMode
  /** Wardrobe/menu presentation: face the camera and turn slowly on the spot. */
  showcase: boolean
  position: [number, number, number]
  /** Base yaw the character settles to. 0 faces the goal; Math.PI the camera. */
  facing: number
  /**
   * Whether celebrating spins them round. True when they play *up* the pitch
   * with their back to us; false when they already face the camera (keeper
   * mode), where a spin would turn them away at the best moment.
   */
  spinToCelebrate: boolean
}

/**
 * The shared skeleton animation for every playable character.
 *
 * Princesses and knights look nothing alike but move identically — they kick
 * the same ball in the same two mini-games. Keeping the motion here means a new
 * character type cannot drift out of sync with the old one, and it is the only
 * part of a character that touches the frame loop.
 */
export function useCharacterRig(rig: Rig, options: RigOptions) {
  const clock = useRef(0)
  const { mode, showcase, position, facing, spinToCelebrate } = options

  // Restart the animation whenever the mode changes, so a second goal in a row
  // replays the celebration instead of continuing mid-way through it.
  useEffect(() => {
    clock.current = 0
  }, [mode])

  useFrame((_, dt) => {
    clock.current += dt
    const t = clock.current
    const g = rig.root.current
    if (!g) return

    if (showcase) {
      g.rotation.y = Math.PI + Math.sin(t * 0.5) * 0.45
      g.position.y = position[1] + Math.sin(t * 1.6) * 0.04
      swing(rig.armL, Math.sin(t * 1.6) * 0.12)
      swing(rig.armR, -Math.sin(t * 1.6) * 0.12)
      return
    }

    if (mode === 'celebrate') {
      // Turn to face the camera, jump, arms in the air.
      g.rotation.y = damp(g.rotation.y, spinToCelebrate ? facing + Math.PI : facing, 6, dt)
      g.position.y = position[1] + Math.abs(Math.sin(t * 6)) * 0.28
      const raise = Math.min(1, t * 4)
      swing(rig.armL, -2.4 * raise + Math.sin(t * 9) * 0.2)
      swing(rig.armR, -2.4 * raise - Math.sin(t * 9) * 0.2)
      swing(rig.legL, 0)
      swing(rig.legR, 0)
      return
    }

    g.rotation.y = damp(g.rotation.y, facing, 6, dt)

    if (mode === 'kick') {
      // A single forward swing of the right leg that settles back to standing.
      const swingT = Math.min(1, t / 0.42)
      const curve = Math.sin(swingT * Math.PI)
      swing(rig.legR, -1.5 * curve)
      swing(rig.legL, 0.25 * curve)
      swing(rig.armL, 0.7 * curve)
      swing(rig.armR, -0.5 * curve)
      g.position.y = position[1]
      return
    }

    // Idle: a small breath, and a bit of a sway.
    g.position.y = position[1] + Math.sin(t * 2) * 0.03
    g.rotation.z = Math.sin(t * 1.3) * 0.02
    swing(rig.armL, Math.sin(t * 2) * 0.1)
    swing(rig.armR, -Math.sin(t * 2) * 0.1)
    swing(rig.legL, 0)
    swing(rig.legR, 0)
  })
}

/** Allocates the refs a character body needs to be driven by the rig. */
export function useRigRefs(): Rig {
  return {
    root: useRef<THREE.Group>(null),
    legL: useRef<THREE.Group>(null),
    legR: useRef<THREE.Group>(null),
    armL: useRef<THREE.Group>(null),
    armR: useRef<THREE.Group>(null),
  }
}

function swing(ref: RefObject<THREE.Group | null>, x: number) {
  if (ref.current) ref.current.rotation.x = x
}

/** Frame-rate independent approach to a target. */
function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt))
}
