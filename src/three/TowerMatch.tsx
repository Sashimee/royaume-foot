import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PITCH, SHOT_TIMEOUT, TOWER } from '../game/constants'
import type { Shot } from '../game/aim'
import { makeBall, stepBall } from '../game/physics'
import type { BallState } from '../game/physics'
import { collideTowers, makeTowers, stepTowers, towersCleared } from '../game/towerGame'
import type { TowerState } from '../game/towerGame'
import type { BallSkin, Character as CharacterData } from '../data/roster'
import type { Accessory as AccessoryData } from '../data/accessories'
import type { Mascot as MascotData } from '../data/mascots'
import { Ball, BallTrail, BlobShadow, TRAIL_LENGTH } from './Ball'
import { Character } from './Character'
import { Mascot } from './Mascot'
import type { CharacterMode } from './characterRig'

/** How long the blocks are left lying about before the next shot. */
const SETTLE_TIME = TOWER.settle

export interface TowerHandle {
  shoot: (shot: Shot) => void
  isReady: () => boolean
}

type Phase = 'aim' | 'flight' | 'settle'

interface Sim {
  ball: BallState
  towers: TowerState
  phase: Phase
  t: number
  /** Blocks knocked by the shot currently in the air. */
  knockedThisShot: number
}

/**
 * "Casse-tour" — the same flick as the shooting mode, aimed at stacks of blocks.
 *
 * It reuses the ball physics and the aim gesture wholesale; the only new thing
 * is what the ball runs into. That is deliberate — a fourth mini-game that
 * needed a fourth control would be a fourth thing to explain.
 *
 * The blocks are plain meshes rather than an InstancedMesh: there are twelve of
 * them and they each need their own rotation, which is exactly the case where
 * instancing costs more code than it saves.
 */
export function TowerMatch({
  api,
  character,
  accessory,
  ballSkin,
  shadowColour,
  mascot,
  frozen,
  cheerUntil,
  onSmash,
}: {
  api: RefObject<TowerHandle | null>
  character: CharacterData
  accessory: AccessoryData
  ballSkin: BallSkin
  shadowColour: string
  mascot: MascotData
  frozen: boolean
  cheerUntil: RefObject<number>
  /** Called once per shot, with how many blocks it brought down. */
  onSmash: (knocked: number) => void
}) {
  const ballRef = useRef<THREE.Group>(null)
  const shadowRef = useRef<THREE.Mesh>(null)
  const blockRefs = useRef<Map<number, THREE.Mesh>>(new Map())
  const trail = useRef<THREE.Vector3[]>([])
  const [charMode, setCharacterMode] = useState<CharacterMode>('idle')

  const sim = useRef<Sim>({ ball: makeBall(), towers: makeTowers(), phase: 'aim', t: 0, knockedThisShot: 0 })
  const spin = useMemo(() => new THREE.Quaternion(), [])
  const axis = useMemo(() => new THREE.Vector3(), [])
  const now = useRef(0)

  const frozenRef = useRef(frozen)
  const smashCallback = useRef(onSmash)
  useEffect(() => {
    frozenRef.current = frozen
    smashCallback.current = onSmash
  }, [frozen, onSmash])

  useEffect(() => {
    api.current = {
      isReady: () => sim.current.phase === 'aim' && !frozenRef.current,
      shoot: (shot) => {
        const s = sim.current
        if (s.phase !== 'aim' || frozenRef.current) return
        s.ball = { p: { ...PITCH.ballStart }, v: { ...shot.velocity }, spin: shot.spin, resting: false }
        s.phase = 'flight'
        s.t = 0
        s.knockedThisShot = 0
        trail.current = []
        setCharacterMode('kick')
      },
    }
    return () => {
      api.current = null
    }
  }, [api])

  useFrame((state, rawDt) => {
    now.current = state.clock.elapsedTime
    const dt = Math.min(rawDt, 0.25)
    const s = sim.current
    s.t += dt

    // Blocks keep falling in every phase — a tower knocked at the end of one
    // shot must land during the next, not freeze in mid-air.
    s.towers = stepTowers(s.towers, dt)

    if (s.phase === 'flight') {
      s.ball = stepBall(s.ball, dt)

      const before = s.towers.knocked
      s.towers = collideTowers(s.towers, s.ball.p, PITCH.ballRadius)
      const hit = s.towers.knocked - before
      if (hit > 0) {
        s.knockedThisShot += hit
        // Bleed the ball's pace off into the blocks, so it drops among them
        // rather than sailing through as though nothing happened.
        s.ball.v.x *= 0.25
        s.ball.v.y = Math.abs(s.ball.v.y) * 0.3 + 1.4
        s.ball.v.z *= 0.2
        s.ball.spin = 0
        cheerUntil.current = now.current + 1.8
      }

      const past = s.ball.p.z < TOWER.z - 2.5
      if (past || s.t > SHOT_TIMEOUT || (s.ball.resting && s.t > 1.0)) {
        s.phase = 'settle'
        s.t = 0
        setCharacterMode(s.knockedThisShot > 0 ? 'celebrate' : 'idle')
        smashCallback.current(s.knockedThisShot)
      }

      pushTrail(trail.current, s.ball.p)
    }

    if (s.phase === 'settle' && s.t > SETTLE_TIME) {
      s.phase = 'aim'
      s.t = 0
      s.ball = makeBall()
      trail.current = []
      setCharacterMode('idle')
      // Rebuild once everything is down, so a child who clears the lot still
      // has something to aim at with the shots they have left.
      if (towersCleared(s.towers)) {
        s.towers = { ...makeTowers(), knocked: s.towers.knocked }
      }
    }

    // --- push the simulation onto the scene graph -------------------------
    const ball = ballRef.current
    if (ball) {
      ball.position.set(s.ball.p.x, s.ball.p.y, s.ball.p.z)
      const speed = Math.hypot(s.ball.v.x, s.ball.v.y, s.ball.v.z)
      if (speed > 0.05) {
        axis.set(s.ball.v.z, 0, -s.ball.v.x).normalize()
        spin.setFromAxisAngle(axis, (speed * dt) / PITCH.ballRadius)
        ball.quaternion.premultiply(spin)
      }
    }

    const shadow = shadowRef.current
    if (shadow) {
      shadow.position.set(s.ball.p.x, 0.02, s.ball.p.z)
      const height = Math.max(0, s.ball.p.y - PITCH.ballRadius)
      shadow.scale.setScalar(1 + height * 0.16)
      ;(shadow.material as THREE.MeshBasicMaterial).opacity = Math.max(0.05, 0.3 - height * 0.03)
    }

    for (const b of s.towers.blocks) {
      const mesh = blockRefs.current.get(b.id)
      if (!mesh) continue
      mesh.position.set(b.x, b.y, b.z)
      // Read, never accumulated: a rebuilt tower has to come back square, and
      // `+=` on the mesh survived the rebuild while the state did not.
      mesh.rotation.z = b.angle
      mesh.rotation.x = b.angle * 0.4
    }
  })

  return (
    <group>
      <group scale={1.2}>
        <Character data={character} accessory={accessory} mode={charMode} position={[-1.05, 0, PITCH.ballStart.z + 0.8]} />
      </group>
      <Mascot data={mascot} home={[1.7, 0, PITCH.ballStart.z - 1.4]} />

      <Blocks towers={sim.current.towers} refs={blockRefs} />

      <Ball skin={ballSkin} ref={ballRef} />
      <BlobShadow ref={shadowRef} colour={shadowColour} />
      <BallTrail history={trail} />
    </group>
  )
}

/**
 * The blocks, in the three colours of a child's building set.
 *
 * Rendered from the *initial* layout and then driven entirely through refs —
 * re-rendering twelve meshes every time one moved would re-render the scene
 * continuously, which is the one thing the project forbids outright.
 */
function Blocks({ towers, refs }: { towers: TowerState; refs: RefObject<Map<number, THREE.Mesh>> }) {
  const palette = ['#ff7bc0', '#7bd3ff', '#ffd84d', '#b6ff9c']

  return (
    <>
      {towers.blocks.map((b) => (
        <mesh
          key={b.id}
          ref={(mesh) => {
            if (mesh) refs.current.set(b.id, mesh)
            else refs.current.delete(b.id)
          }}
          position={[b.x, b.y, b.z]}
          castShadow={false}
        >
          <boxGeometry args={[TOWER.blockSize, TOWER.blockSize, TOWER.blockSize]} />
          <meshToonMaterial color={palette[b.row % palette.length]} />
        </mesh>
      ))}
    </>
  )
}

function pushTrail(history: THREE.Vector3[], p: { x: number; y: number; z: number }) {
  history.unshift(new THREE.Vector3(p.x, p.y, p.z))
  if (history.length > TRAIL_LENGTH) history.length = TRAIL_LENGTH
}
