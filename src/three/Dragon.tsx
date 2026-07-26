import { useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const SKIN = '#6fce84'
const SKIN_DARK = '#57b86d'
const BELLY = '#f4f7c9'
const HORN = '#ffd84d'
const MEMBRANE = '#b8ecc4'

/**
 * The friendly dragon. He plays the keeper in shooting mode and the striker in
 * keeping mode, so he is on screen in both — worth building properly.
 *
 * He is drawn to read as a *silhouette* first: separate neck, distinct head,
 * fanned wing membranes, a segmented tail. The previous version was a single
 * sphere with pebbles for wings, which collapsed into a green blob at any
 * distance. Still primitives only — no model file.
 *
 * The match loop drives `ref.position` and the dive lean; the breathing,
 * flapping and tail sway live here.
 */
export function Dragon({ ref }: { ref?: RefObject<THREE.Group | null> }) {
  const wingL = useRef<THREE.Group>(null)
  const wingR = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const flap = Math.sin(t * 4) * 0.55

    // Wings beat around a swept-back rest pose rather than straight out.
    if (wingL.current) wingL.current.rotation.z = 0.35 + flap
    if (wingR.current) wingR.current.rotation.z = -0.35 - flap
    if (body.current) body.current.position.y = Math.sin(t * 2.2) * 0.045
    // The head lags the body a little, which is most of what sells "alive".
    if (head.current) {
      head.current.rotation.x = Math.sin(t * 2.2 - 0.5) * 0.07
      head.current.rotation.y = Math.sin(t * 0.7) * 0.18
    }
    if (tail.current) tail.current.rotation.y = Math.sin(t * 1.6) * 0.22
  })

  return (
    <group ref={ref} scale={1.15}>
      <group ref={body}>
        <Legs />

        {/* Barrel body, deeper than it is wide so it reads side-on too. */}
        <mesh position={[0, 0.95, 0]} scale={[1, 1.05, 1.18]}>
          <sphereGeometry args={[0.55, 18, 14]} />
          <meshToonMaterial color={SKIN} />
        </mesh>

        {/* Belly plates — the light band is what separates front from back. */}
        {[0.62, 0.9, 1.18].map((y, i) => (
          <mesh key={y} position={[0, y, 0.5 - i * 0.04]} rotation={[0.25, 0, 0]} scale={[1, 1, 0.35]}>
            <sphereGeometry args={[0.2 - i * 0.02, 10, 8]} />
            <meshToonMaterial color={BELLY} />
          </mesh>
        ))}

        {/* Ridge spikes down the spine. */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 1.35 - i * 0.22, -0.28 - i * 0.1]} rotation={[-0.5, 0, 0]}>
            <coneGeometry args={[0.08 - i * 0.012, 0.22 - i * 0.03, 6]} />
            <meshToonMaterial color={HORN} />
          </mesh>
        ))}

        <Neck />
        <group ref={head}>
          <Head />
        </group>

        <group ref={wingL} position={[-0.46, 1.15, -0.12]}>
          <Wing side={-1} />
        </group>
        <group ref={wingR} position={[0.46, 1.15, -0.12]}>
          <Wing side={1} />
        </group>

        <group ref={tail} position={[0, 0.72, -0.42]}>
          <Tail />
        </group>
      </group>
    </group>
  )
}

function Legs() {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.27, 0, 0]}>
          {/* Thigh, angled — a straight cylinder reads as a peg. */}
          <mesh position={[0, 0.42, -0.04]} rotation={[0.2, 0, 0]}>
            <capsuleGeometry args={[0.15, 0.26, 4, 10]} />
            <meshToonMaterial color={SKIN} />
          </mesh>
          <mesh position={[0, 0.16, 0.02]}>
            <capsuleGeometry args={[0.1, 0.14, 4, 8]} />
            <meshToonMaterial color={SKIN_DARK} />
          </mesh>
          {/* Foot with visible toes. */}
          <mesh position={[0, 0.07, 0.14]}>
            <sphereGeometry args={[0.15, 10, 8]} />
            <meshToonMaterial color={SKIN_DARK} />
          </mesh>
          {[-1, 0, 1].map((toe) => (
            <mesh key={toe} position={[toe * 0.08, 0.05, 0.26]}>
              <sphereGeometry args={[0.055, 8, 6]} />
              <meshToonMaterial color={HORN} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

function Neck() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 1.32 + i * 0.19, 0.16 + i * 0.11]} rotation={[0.5, 0, 0]}>
          <capsuleGeometry args={[0.19 - i * 0.02, 0.12, 4, 10]} />
          <meshToonMaterial color={SKIN} />
        </mesh>
      ))}
    </>
  )
}

function Head() {
  return (
    <group position={[0, 1.95, 0.46]}>
      <mesh scale={[1, 0.95, 1.1]}>
        <sphereGeometry args={[0.31, 16, 14]} />
        <meshToonMaterial color={SKIN} />
      </mesh>

      {/* Muzzle: a rounded box, not a cone — a cone reads as a beak. */}
      <mesh position={[0, -0.07, 0.3]} scale={[0.85, 0.7, 1]}>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshToonMaterial color={SKIN_DARK} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.07, -0.03, 0.47]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshBasicMaterial color="#3c6b47" />
        </mesh>
      ))}
      {/* A smile. */}
      <mesh position={[0, -0.14, 0.36]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.09, 0.018, 6, 12, Math.PI]} />
        <meshBasicMaterial color="#3c6b47" />
      </mesh>

      {/* Big friendly eyes: white, pupil, and a highlight. */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.16, 0.1, 0.22]}>
          <mesh>
            <sphereGeometry args={[0.115, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[side * 0.01, 0, 0.08]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshBasicMaterial color="#2c2438" />
          </mesh>
          <mesh position={[side * 0.03, 0.04, 0.12]}>
            <sphereGeometry args={[0.022, 6, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Horns swept back, and a pair of ear frills. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.16, 0.26, -0.06]} rotation={[-0.7, 0, side * 0.3]}>
          <coneGeometry args={[0.06, 0.3, 8]} />
          <meshToonMaterial color={HORN} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.3, 0.04, -0.06]} rotation={[0, 0, side * -0.5]} scale={[1, 1, 0.25]}>
          <circleGeometry args={[0.17, 8, Math.PI * 0.1, Math.PI * 0.8]} />
          <meshToonMaterial color={MEMBRANE} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * A wing: a fanned membrane (a circle *sector*, which is exactly the shape
 * wanted) with finger bones across it.
 */
function Wing({ side }: { side: number }) {
  return (
    <group rotation={[0, side * 0.25, 0]}>
      <mesh position={[side * 0.42, 0.05, 0]} rotation={[0, Math.PI / 2, side * 0.2]}>
        <circleGeometry args={[0.78, 10, Math.PI * 0.72, Math.PI * 0.72]} />
        <meshToonMaterial color={MEMBRANE} side={THREE.DoubleSide} />
      </mesh>
      {/* Leading edge and two fingers. */}
      <mesh position={[side * 0.35, 0.18, 0]} rotation={[0, 0, side * -0.9]}>
        <capsuleGeometry args={[0.045, 0.62, 4, 8]} />
        <meshToonMaterial color={SKIN_DARK} />
      </mesh>
      {[0.35, 0.75].map((f) => (
        <mesh
          key={f}
          position={[side * 0.42, -0.05 - f * 0.18, 0]}
          rotation={[0, 0, side * (-1.25 - f * 0.35)]}
        >
          <capsuleGeometry args={[0.03, 0.5, 4, 6]} />
          <meshToonMaterial color={SKIN_DARK} />
        </mesh>
      ))}
    </group>
  )
}

function Tail() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, -i * 0.11, -0.22 - i * 0.26]}>
          <sphereGeometry args={[0.2 - i * 0.035, 10, 8]} />
          <meshToonMaterial color={SKIN} />
        </mesh>
      ))}
      {/* Spade tip. */}
      <mesh position={[0, -0.46, -1.32]} rotation={[Math.PI / 2.2, 0, 0]}>
        <coneGeometry args={[0.16, 0.3, 8]} />
        <meshToonMaterial color={HORN} />
      </mesh>
    </>
  )
}
