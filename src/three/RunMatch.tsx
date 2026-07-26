import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RUN } from '../game/constants'
import { makeRun, runIsOver, stepRun } from '../game/runGame'
import type { RunState } from '../game/runGame'
import type { BallSkin, Character as CharacterData } from '../data/roster'
import type { Mascot as MascotData } from '../data/mascots'
import { Ball, BlobShadow } from './Ball'
import { Character } from './Character'
import { Mascot } from './Mascot'

export interface RunHandle {
  /** Where along the lane the child wants the runner, in pitch units. */
  aimAt: (x: number) => void
  /** 0..1, for the HUD time bar. */
  progress: () => number
}

/** How many star meshes exist. Reused in a pool rather than mounted per spawn. */
const POOL = 24

/**
 * "Course aux étoiles". The runner stays put near the camera and the world
 * flows towards them — so the character stays large and readable for the whole
 * run instead of shrinking away down the pitch.
 *
 * The stars are a fixed pool of meshes that get moved and hidden, never mounted
 * and unmounted: spawning React nodes twice a second would re-render the scene
 * constantly, and this loop must not re-render at all.
 */
export function RunMatch({
  api,
  character,
  ballSkin,
  shadowColour,
  mascot,
  frozen,
  cheerUntil,
  onCollect,
  onFinish,
}: {
  api: RefObject<RunHandle | null>
  character: CharacterData
  ballSkin: BallSkin
  shadowColour: string
  mascot: MascotData
  frozen: boolean
  cheerUntil: RefObject<number>
  onCollect: (big: boolean) => void
  onFinish: (collected: number, big: number) => void
}) {
  const playerRef = useRef<THREE.Group>(null)
  const ballRef = useRef<THREE.Group>(null)
  const shadowRef = useRef<THREE.Mesh>(null)
  const starsRef = useRef<THREE.Group>(null)
  const [celebrating, setCelebrating] = useState(false)

  const sim = useRef<RunState>(makeRun())
  const wantedX = useRef(0)
  const finished = useRef(false)
  const now = useRef(0)

  const collectCallback = useRef(onCollect)
  const finishCallback = useRef(onFinish)
  useEffect(() => {
    collectCallback.current = onCollect
    finishCallback.current = onFinish
  }, [onCollect, onFinish])

  useEffect(() => {
    api.current = {
      aimAt: (x) => {
        wantedX.current = x
      },
      progress: () => Math.min(1, sim.current.t / RUN.duration),
    }
    return () => {
      api.current = null
    }
  }, [api])

  useFrame((state, rawDt) => {
    now.current = state.clock.elapsedTime
    const dt = Math.min(rawDt, 0.25)

    if (!finished.current && !frozen) {
      sim.current = stepRun(sim.current, dt, wantedX.current)

      for (const id of sim.current.justCollected) {
        const big = id % RUN.bigEvery === 0
        collectCallback.current(big)
        if (big) cheerUntil.current = now.current + 1.4
      }

      if (runIsOver(sim.current)) {
        finished.current = true
        setCelebrating(true)
        finishCallback.current(sim.current.collected, sim.current.bigCollected)
      }
    }

    const s = sim.current

    const player = playerRef.current
    if (player) player.position.x = s.playerX

    // The ball rolls along ahead of the runner, so the mode still reads as
    // football rather than as a generic collect-'em-up. It is offset to one
    // side on purpose: the camera is directly behind her, so a ball straight
    // ahead sits entirely inside her silhouette and may as well not exist.
    const ball = ballRef.current
    const shadow = shadowRef.current
    if (ball && shadow) {
      const bx = s.playerX + 0.62
      ball.position.set(bx, 0.34, RUN.playerZ - 1.7)
      ball.rotation.x -= dt * 12
      shadow.position.set(bx, 0.02, RUN.playerZ - 1.7)
    }

    const pool = starsRef.current?.children as THREE.Group[] | undefined
    if (pool) {
      for (let i = 0; i < pool.length; i++) {
        const item = s.items[i]
        const mesh = pool[i]
        if (!item) {
          mesh.scale.setScalar(0)
          continue
        }
        mesh.position.set(item.x, item.big ? 1.0 : 0.75, item.z)
        mesh.scale.setScalar(item.big ? 1.5 : 1)
        mesh.rotation.y += dt * (item.big ? 3 : 2)
        // Golden ones bob, which is most of what makes them catch the eye.
        if (item.big) mesh.position.y += Math.sin(now.current * 5) * 0.12
      }
    }
  })

  return (
    <group>
      <group ref={playerRef} position={[0, 0, RUN.playerZ]}>
        <group scale={1.2}>
          <Character
            data={character}
            mode={celebrating ? 'celebrate' : 'idle'}
            facing={0}
            spinToCelebrate
          />
        </group>
      </group>

      <Mascot data={mascot} follow={playerRef} offset={[1.15, 0, 0.9]} />

      <Ball skin={ballSkin} ref={ballRef} />
      <BlobShadow ref={shadowRef} colour={shadowColour} />

      <group ref={starsRef}>
        {Array.from({ length: POOL }, (_, i) => (
          <group key={i} scale={0}>
            <Star />
          </group>
        ))}
      </group>
    </group>
  )
}

/**
 * A real five-pointed star.
 *
 * Built from a Shape with alternating radii, not from a cone: a cone with five
 * radial segments is a *pentagon* seen from the front, which is exactly what the
 * first version drew. Extruded slightly so it does not vanish when it turns
 * edge-on, and the geometry is created once and shared by the whole pool.
 */
const STAR_GEOMETRY = buildStarGeometry()

function buildStarGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape()
  const points = 5
  const outer = 0.42
  const inner = 0.18
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? outer : inner
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false })
}

function Star() {
  return (
    <mesh geometry={STAR_GEOMETRY} position={[0, 0, -0.06]}>
      <meshToonMaterial color="#ffd84d" emissive="#7a5c00" />
    </mesh>
  )
}
