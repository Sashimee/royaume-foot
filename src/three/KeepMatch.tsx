import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { KEEP, PITCH } from '../game/constants'
import type { Attempt } from '../game/keeperGame'
import { ballPosAt, isSave, makeAttempt, seededRandom, stepPlayerKeeper } from '../game/keeperGame'
import type { BallSkin, Character as CharacterData } from '../data/roster'
import { Ball, BlobShadow } from './Ball'
import { Dragon } from './Dragon'
import { Character } from './Character'
import type { CharacterMode } from './characterRig'

export interface KeepHandle {
  /** Where along the goal line the child wants her, in pitch units. */
  aimAt: (x: number) => void
}

type Phase = 'windup' | 'flight' | 'settle'

interface Sim {
  attempt: Attempt
  phase: Phase
  t: number
  /** Where the child is pointing. */
  wantedX: number
  keeperX: number
}

/**
 * "Gardienne du château": the child stands in goal and a friendly dragon shoots.
 *
 * Same camera as the shooting mode, which is not laziness — it means the child
 * sees the princess's *face* rather than her back, and the goal is already
 * framed correctly for a portrait phone.
 */
export function KeepMatch({
  api,
  character,
  ballSkin,
  shadowColour,
  frozen,
  cheerUntil,
  onResult,
}: {
  api: RefObject<KeepHandle | null>
  character: CharacterData
  ballSkin: BallSkin
  shadowColour: string
  frozen: boolean
  cheerUntil: RefObject<number>
  onResult: (saved: boolean) => void
}) {
  const ballRef = useRef<THREE.Group>(null)
  const shadowRef = useRef<THREE.Mesh>(null)
  const shooterRef = useRef<THREE.Group>(null)
  const playerRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Group>(null)
  const [charMode, setCharacterMode] = useState<CharacterMode>('idle')

  const rand = useMemo(() => seededRandom(Date.now() & 0xffff), [])
  const sim = useRef<Sim>({
    attempt: makeAttempt(rand),
    phase: 'windup',
    t: 0,
    wantedX: 0,
    keeperX: 0,
  })
  const now = useRef(0)

  const frozenRef = useRef(frozen)
  const resultCallback = useRef(onResult)
  useEffect(() => {
    frozenRef.current = frozen
    resultCallback.current = onResult
  }, [frozen, onResult])

  useEffect(() => {
    api.current = {
      aimAt: (x) => {
        sim.current.wantedX = x
      },
    }
    return () => {
      api.current = null
    }
  }, [api])

  useFrame((state, rawDt) => {
    now.current = state.clock.elapsedTime
    // Same reasoning as the shooting loop: a small ceiling would make a slow
    // device run in slow motion rather than drop frames.
    const dt = Math.min(rawDt, 0.25)
    const s = sim.current
    s.t += dt

    // She follows the finger in every phase — including while the ball flies,
    // so a late reaction is still worth attempting.
    s.keeperX = stepPlayerKeeper(s.keeperX, s.wantedX, dt)

    if (s.phase === 'windup' && s.t >= KEEP.windUp && !frozenRef.current) {
      s.phase = 'flight'
      s.t = 0
    } else if (s.phase === 'flight' && s.t >= KEEP.flightTime) {
      const saved = isSave(s.attempt, s.keeperX)
      s.phase = 'settle'
      s.t = 0
      setCharacterMode(saved ? 'celebrate' : 'idle')
      if (saved) cheerUntil.current = now.current + 2.2
      resultCallback.current(saved)
    } else if (s.phase === 'settle' && s.t >= KEEP.settle) {
      s.attempt = makeAttempt(rand)
      s.phase = 'windup'
      s.t = 0
      setCharacterMode('idle')
    }

    // --- drive the scene ---------------------------------------------------
    const princessGroup = playerRef.current
    if (princessGroup) princessGroup.position.x = s.keeperX

    const ball = ballRef.current
    const shadow = shadowRef.current
    if (ball && shadow) {
      // During wind-up the ball waits at the dragon's feet; after the shot it
      // carries on past the goal line so it visibly hits the net.
      const t = s.phase === 'windup' ? 0 : Math.min(s.t, KEEP.flightTime * 1.25)
      const p = s.phase === 'windup' ? ballPosAt(s.attempt, 0) : ballPosAt(s.attempt, t)
      ball.position.set(p.x, Math.max(PITCH.ballRadius, p.y), p.z)
      ball.rotation.x -= dt * 9
      shadow.position.set(p.x, 0.02, p.z)
      const lift = Math.max(0, p.y - PITCH.ballRadius)
      shadow.scale.setScalar(1 + lift * 0.16)
      ;(shadow.material as THREE.MeshBasicMaterial).opacity = Math.max(0.05, 0.3 - lift * 0.03)
    }

    const shooter = shooterRef.current
    if (shooter) {
      shooter.position.x = s.attempt.fromX
      // A little lunge on the kick, so the shot has a visible cause.
      const lunge = s.phase === 'flight' ? Math.max(0, 1 - s.t / 0.3) : 0
      shooter.position.z = KEEP.shooterZ + 0.6 - lunge * 0.6
    }

    const ring = ringRef.current
    if (ring) {
      // The telegraph, shown during the wind-up only.
      //
      // Hidden by *scaling to zero*, never by toggling `visible`. R3F owns the
      // props it renders and re-applies them on each re-render, so a flag
      // written from the frame loop and also declared in JSX ends up in a fight
      // that the frame loop does not reliably win — and the one thing this
      // marker must never do is fail to appear. A transform nobody declares is
      // unambiguous.
      if (s.phase === 'windup') {
        ring.position.set(s.attempt.targetX, s.attempt.targetY, PITCH.goalZ + 0.2)
        // Shrinks as the kick approaches: a countdown the child can feel.
        const progress = Math.min(1, s.t / KEEP.windUp)
        ring.scale.setScalar(1.5 - progress * 0.6 + Math.sin(s.t * 14) * 0.06)
        ring.rotation.z = s.t * 1.4
      } else {
        ring.scale.setScalar(0)
      }
    }
  })

  return (
    <group>
      {/* The player's keeper. `facing` turns her towards the shooter, which is
          also towards the camera — so the child sees her face, not her back. */}
      <group ref={playerRef} position={[0, 0, PITCH.goalZ + 0.7]}>
        <group scale={1.2}>
          <Character data={character} mode={charMode} facing={Math.PI} spinToCelebrate={false} />
        </group>
      </group>

      {/* The dragon takes the shots in this mode, so he turns to face the goal. */}
      <group ref={shooterRef} rotation={[0, Math.PI, 0]}>
        <Dragon />
      </group>

      <Ball skin={ballSkin} ref={ballRef} />
      <BlobShadow ref={shadowRef} colour={shadowColour} />

      {/* The telegraph. Two things keep it readable:
          - white-cyan, not gold, so it is never mistaken for a decorative crown;
          - `depthTest={false}` and a high render order, so it draws on top of
            everything. A shot aimed at the centre of the goal puts the ring
            directly behind the princess, and the one marker the child must be
            able to read would vanish exactly when the shot is hardest. */}
      <group ref={ringRef} renderOrder={10}>
        <mesh>
          <torusGeometry args={[0.75, 0.14, 8, 28]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.92} depthWrite={false} depthTest={false} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.42, 0.09, 8, 24]} />
          <meshBasicMaterial color="#5cf0ff" transparent opacity={0.92} depthWrite={false} depthTest={false} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.95} depthWrite={false} depthTest={false} />
        </mesh>
      </group>
    </group>
  )
}
