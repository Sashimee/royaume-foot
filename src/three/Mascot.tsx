import { useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Mascot as MascotData } from '../data/mascots'
import { visibleHalfWidthAt } from '../game/constants'

/**
 * The player's companion.
 *
 * It trots to a spot beside whoever is playing and *lags* on the way — a pet
 * welded to a fixed offset reads as a prop bolted to the character, while one
 * that catches up reads as alive. It never affects play.
 */
export function Mascot({
  data,
  follow,
  offset = [1.4, 0, 0.5],
  home = [0, 0, 0],
}: {
  data: MascotData
  /** Optional group to trail. Without it the mascot simply sits at `home`. */
  follow?: RefObject<THREE.Group | null>
  offset?: [number, number, number]
  home?: [number, number, number]
}) {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)

  useFrame((state, dt) => {
    const g = root.current
    if (!g) return
    const t = state.clock.elapsedTime

    const targetZ = (follow?.current ? follow.current.position.z : home[2]) + offset[2]
    // Keep it on screen. Following a player who is themselves near the edge of
    // the frame would otherwise walk the pet straight out of shot.
    const room = Math.max(0.4, visibleHalfWidthAt(targetZ) - 0.5)
    const wanted = (follow?.current ? follow.current.position.x : home[0]) + offset[0]
    const targetX = Math.min(room, Math.max(-room, wanted))
    // Catch up rather than snap.
    const k = 1 - Math.exp(-6 * Math.min(dt, 0.25))
    g.position.x = THREE.MathUtils.lerp(g.position.x, targetX, k)
    g.position.z = THREE.MathUtils.lerp(g.position.z, targetZ, k)

    // A little hop, faster the further it is from where it wants to be.
    const chasing = Math.min(1, Math.abs(targetX - g.position.x) * 2)
    if (body.current) {
      body.current.position.y = Math.abs(Math.sin(t * (5 + chasing * 6))) * (0.06 + chasing * 0.12)
      body.current.rotation.z = Math.sin(t * 4) * 0.06
    }
  })

  return (
    <group ref={root} position={home}>
      <group ref={body} scale={0.55}>
        {/* Body and head, shared by every kind. */}
        <mesh position={[0, 0.34, 0]} scale={[1, 0.9, 1.15]}>
          <sphereGeometry args={[0.3, 14, 12]} />
          <meshToonMaterial color={data.body} />
        </mesh>
        <mesh position={[0, 0.3, -0.24]} scale={[0.8, 0.7, 0.5]}>
          <sphereGeometry args={[0.24, 12, 10]} />
          <meshToonMaterial color={data.belly} />
        </mesh>
        <mesh position={[0, 0.6, -0.2]}>
          <sphereGeometry args={[0.23, 14, 12]} />
          <meshToonMaterial color={data.body} />
        </mesh>
        {/* Eyes, always facing the same way as the player: towards -z. */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.09, 0.63, -0.38]}>
            <sphereGeometry args={[0.038, 8, 8]} />
            <meshBasicMaterial color="#2c2438" />
          </mesh>
        ))}
        {/* Legs. */}
        {[-1, 1].map((side) =>
          [-1, 1].map((front) => (
            <mesh key={`${side}${front}`} position={[side * 0.15, 0.1, front * 0.18]}>
              <capsuleGeometry args={[0.06, 0.1, 3, 6]} />
              <meshToonMaterial color={data.body} />
            </mesh>
          )),
        )}
        <Extras data={data} />
      </group>
    </group>
  )
}

/** The bits that tell one mascot from another. */
function Extras({ data }: { data: MascotData }) {
  switch (data.kind) {
    case 'cat':
      return (
        <>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.13, 0.79, -0.19]} rotation={[0, 0, side * 0.2]}>
              <coneGeometry args={[0.08, 0.16, 4]} />
              <meshToonMaterial color={data.body} />
            </mesh>
          ))}
          <mesh position={[0, 0.5, 0.34]} rotation={[0.9, 0, 0]}>
            <capsuleGeometry args={[0.045, 0.34, 3, 6]} />
            <meshToonMaterial color={data.accent} />
          </mesh>
        </>
      )
    case 'bunny':
      return (
        <>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.09, 0.92, -0.2]} rotation={[0, 0, side * 0.18]}>
              <capsuleGeometry args={[0.055, 0.24, 3, 6]} />
              <meshToonMaterial color={data.accent} />
            </mesh>
          ))}
          <mesh position={[0, 0.36, 0.3]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshToonMaterial color={data.belly} />
          </mesh>
        </>
      )
    case 'unicorn':
      return (
        <>
          <mesh position={[0, 0.86, -0.24]} rotation={[-0.25, 0, 0]}>
            <coneGeometry args={[0.05, 0.24, 8]} />
            <meshToonMaterial color={data.accent} emissive="#5a2f7a" />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.72 - i * 0.11, -0.02 + i * 0.06]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshToonMaterial color={data.accent} />
            </mesh>
          ))}
          <mesh position={[0, 0.44, 0.32]} rotation={[0.7, 0, 0]}>
            <capsuleGeometry args={[0.07, 0.24, 3, 6]} />
            <meshToonMaterial color={data.accent} />
          </mesh>
        </>
      )
    case 'dragonling':
      return (
        <>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.11, 0.79, -0.16]} rotation={[0.3, 0, side * 0.3]}>
              <coneGeometry args={[0.045, 0.14, 6]} />
              <meshToonMaterial color={data.accent} />
            </mesh>
          ))}
          {[-1, 1].map((side) => (
            <mesh
              key={`w${side}`}
              position={[side * 0.3, 0.45, 0.06]}
              rotation={[0, side * 0.4, side * -0.5]}
              scale={[1, 1, 0.2]}
            >
              <circleGeometry args={[0.26, 8, Math.PI * 0.1, Math.PI * 0.8]} />
              <meshToonMaterial color={data.belly} side={THREE.DoubleSide} />
            </mesh>
          ))}
          <mesh position={[0, 0.32, 0.34]} rotation={[0.8, 0, 0]}>
            <capsuleGeometry args={[0.06, 0.26, 3, 6]} />
            <meshToonMaterial color={data.body} />
          </mesh>
        </>
      )
  }
}
