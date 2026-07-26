import * as THREE from 'three'
import type { Knight as KnightData } from '../data/roster'
import { useCharacterRig, useRigRefs } from './characterRig'
import type { CharacterMode } from './characterRig'

/**
 * A knight, built from primitives like the princesses and driven by the exact
 * same rig — so they kick, celebrate and pose identically.
 *
 * The helmet is **open-faced on purpose**. A closed visor is more accurate and
 * completely wrong for the audience: a blank slit has no expression, and the
 * whole cast of this game has to look friendly. Visor up, face visible, smile.
 */
export function Knight({
  data,
  mode = 'idle',
  showcase = false,
  position = [0, 0, 0],
  facing = 0,
  spinToCelebrate = true,
}: {
  data: KnightData
  mode?: CharacterMode
  showcase?: boolean
  position?: [number, number, number]
  facing?: number
  spinToCelebrate?: boolean
}) {
  const rig = useRigRefs()
  useCharacterRig(rig, { mode, showcase, position, facing, spinToCelebrate })

  return (
    <group ref={rig.root} position={position}>
      <group ref={rig.legL} position={[-0.13, 0.44, 0]}>
        <Leg data={data} />
      </group>
      <group ref={rig.legR} position={[0.13, 0.44, 0]}>
        <Leg data={data} />
      </group>

      {/* Cuirass: a tapered barrel, wider at the shoulders than the waist. */}
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.31, 0.24, 0.62, 14]} />
        <meshToonMaterial color={data.armour} />
      </mesh>
      {/* Belt. */}
      <mesh position={[0, 0.54, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.09, 14]} />
        <meshToonMaterial color={data.armourTrim} />
      </mesh>
      {/* Tassets — the skirt of plates. */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.27, 0.33, 0.2, 12]} />
        <meshToonMaterial color={data.armour} />
      </mesh>

      <Cape colour={data.cape} />

      {/* Pauldrons. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.31, 1.06, 0]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.16, 12, 10]} />
          <meshToonMaterial color={data.armourTrim} />
        </mesh>
      ))}

      <group ref={rig.armL} position={[-0.31, 1.02, 0]}>
        <Arm data={data} />
        <Shield data={data} />
      </group>
      <group ref={rig.armR} position={[0.31, 1.02, 0]}>
        <Arm data={data} />
      </group>

      <Head data={data} />
    </group>
  )
}

function Leg({ data }: { data: KnightData }) {
  return (
    <>
      <mesh position={[0, -0.2, 0]}>
        <capsuleGeometry args={[0.085, 0.26, 3, 8]} />
        <meshToonMaterial color={data.armour} />
      </mesh>
      {/* Knee cop. */}
      <mesh position={[0, -0.13, -0.05]}>
        <sphereGeometry args={[0.075, 8, 8]} />
        <meshToonMaterial color={data.armourTrim} />
      </mesh>
      {/* Sabaton. */}
      <mesh position={[0, -0.37, -0.04]}>
        <boxGeometry args={[0.19, 0.11, 0.26]} />
        <meshToonMaterial color={data.armourTrim} />
      </mesh>
    </>
  )
}

function Arm({ data }: { data: KnightData }) {
  return (
    <>
      <mesh position={[0, -0.18, 0]}>
        <capsuleGeometry args={[0.065, 0.22, 3, 8]} />
        <meshToonMaterial color={data.armour} />
      </mesh>
      <mesh position={[0, -0.33, 0]}>
        <sphereGeometry args={[0.075, 8, 8]} />
        <meshToonMaterial color={data.skin} />
      </mesh>
    </>
  )
}

/**
 * A cape hung from the shoulders — a cylinder wedge reads better than a plane.
 *
 * In CylinderGeometry theta is measured from **+z**, so a wedge centred on 0
 * sits on his back, which is what a cape does. He is modelled facing -z; any
 * rotation or offset that swings the wedge towards -z drapes it across his
 * chest and hides the entire cuirass.
 */
function Cape({ colour }: { colour: string }) {
  return (
    <mesh position={[0, 0.78, 0.06]}>
      <cylinderGeometry args={[0.3, 0.46, 0.86, 14, 1, true, -Math.PI * 0.42, Math.PI * 0.84]} />
      <meshToonMaterial color={colour} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Shield({ data }: { data: KnightData }) {
  return (
    <group position={[-0.16, -0.24, -0.04]} rotation={[0, 0, 0.25]}>
      <mesh scale={[1, 1.25, 0.28]}>
        <sphereGeometry args={[0.21, 12, 10]} />
        <meshToonMaterial color={data.armourTrim} />
      </mesh>
      <mesh position={[0, 0, -0.07]} scale={[0.82, 1.05, 0.2]}>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshToonMaterial color={data.cape} />
      </mesh>
      <Crest crest={data.crest} colour={data.armourTrim} />
    </group>
  )
}

/** The emblem, drawn as a small primitive rather than a texture. */
function Crest({ crest, colour }: { crest: KnightData['crest']; colour: string }) {
  const z = -0.13
  switch (crest) {
    case 'star':
      return (
        <mesh position={[0, 0, z]} rotation={[0, Math.PI, 0]}>
          <coneGeometry args={[0.1, 0.03, 5]} />
          <meshBasicMaterial color={colour} />
        </mesh>
      )
    case 'heart':
      return (
        <group position={[0, 0, z]}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.04, 0.03, 0]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshBasicMaterial color={colour} />
            </mesh>
          ))}
          <mesh position={[0, -0.05, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.07, 0.09, 8]} />
            <meshBasicMaterial color={colour} />
          </mesh>
        </group>
      )
    case 'moon':
      return (
        <mesh position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.07, 0.025, 6, 14, Math.PI * 1.3]} />
          <meshBasicMaterial color={colour} />
        </mesh>
      )
    case 'shield':
      return (
        <mesh position={[0, 0, z]} scale={[1, 1.2, 0.2]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color={colour} />
        </mesh>
      )
  }
}

function Head({ data }: { data: KnightData }) {
  return (
    <group position={[0, 1.34, 0]}>
      {/* Face — built facing -z, like the princesses. */}
      <mesh>
        <sphereGeometry args={[0.21, 18, 14]} />
        <meshToonMaterial color={data.skin} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.08, 0.0, -0.185]}>
          <sphereGeometry args={[0.036, 8, 8]} />
          <meshBasicMaterial color="#3b2b3f" />
        </mesh>
      ))}
      <mesh position={[0, -0.08, -0.17]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.055, 0.014, 6, 12, Math.PI]} />
        <meshBasicMaterial color="#8a4a52" />
      </mesh>

      {/* Helmet: a cap that stops well above the eyes. It sat lower with a
          nasal bar, which at this size read as a gold stripe across his face —
          and a face a child cannot see cannot look friendly. */}
      <mesh position={[0, 0.1, 0.02]}>
        <sphereGeometry args={[0.225, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshToonMaterial color={data.armour} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.1, 0.02]}>
        <torusGeometry args={[0.222, 0.028, 6, 20]} />
        <meshToonMaterial color={data.armourTrim} />
      </mesh>
      {/* Cheek guards, framing the face instead of covering it. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.19, 0.0, -0.02]} scale={[0.5, 1, 0.8]}>
          <sphereGeometry args={[0.12, 10, 10]} />
          <meshToonMaterial color={data.armour} />
        </mesh>
      ))}

      {/* Plume. */}
      <mesh position={[0, 0.3, 0.03]} rotation={[0.35, 0, 0]}>
        <capsuleGeometry args={[0.055, 0.22, 4, 8]} />
        <meshToonMaterial color={data.plume} />
      </mesh>
      <mesh position={[0, 0.24, 0.16]} rotation={[0.9, 0, 0]}>
        <capsuleGeometry args={[0.045, 0.2, 4, 8]} />
        <meshToonMaterial color={data.plume} />
      </mesh>
    </group>
  )
}
