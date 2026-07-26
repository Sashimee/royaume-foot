import * as THREE from 'three'
import type { Princess as PrincessData } from '../data/roster'
import { useCharacterRig, useRigRefs } from './characterRig'
import type { CharacterMode } from './characterRig'

/**
 * A princess built entirely from primitives — no .glb, no modelling tool, no
 * asset pipeline. Every distinctive feature is a colour or a flag on the roster
 * entry, so a new character is a data change.
 *
 * She is modelled facing **-z** (towards the goal), which is the direction she
 * plays in. Motion lives in the shared character rig, so she and the knights
 * cannot drift apart.
 */
export function Princess({
  data,
  mode = 'idle',
  showcase = false,
  position = [0, 0, 0],
  facing = 0,
  spinToCelebrate = true,
}: {
  data: PrincessData
  mode?: CharacterMode
  /** Wardrobe/menu presentation: face the camera and turn slowly on the spot. */
  showcase?: boolean
  position?: [number, number, number]
  /** Base yaw she settles to. 0 faces the goal; Math.PI faces the camera. */
  facing?: number
  spinToCelebrate?: boolean
}) {
  const rig = useRigRefs()
  useCharacterRig(rig, { mode, showcase, position, facing, spinToCelebrate })

  return (
    <group ref={rig.root} position={position}>
      {/* Legs pivot at the hip so the kick rotates from the right place. */}
      <group ref={rig.legL} position={[-0.12, 0.38, 0]}>
        <Leg skin={data.skin} />
      </group>
      <group ref={rig.legR} position={[0.12, 0.38, 0]}>
        <Leg skin={data.skin} />
      </group>

      <mesh position={[0, 0.72, 0]}>
        <coneGeometry args={[0.48, 0.82, 16]} />
        <meshToonMaterial color={data.dress} />
      </mesh>
      {/* Hem trim. */}
      <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 20]} />
        <meshToonMaterial color={data.dressTrim} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, 1.18, 0]}>
        <cylinderGeometry args={[0.17, 0.2, 0.34, 12]} />
        <meshToonMaterial color={data.dressTrim} />
      </mesh>

      <group ref={rig.armL} position={[-0.22, 1.3, 0]}>
        <Arm skin={data.skin} />
      </group>
      <group ref={rig.armR} position={[0.22, 1.3, 0]}>
        <Arm skin={data.skin} />
      </group>

      <Head data={data} />
    </group>
  )
}

function Leg({ skin }: { skin: string }) {
  return (
    <>
      <mesh position={[0, -0.18, 0]}>
        <capsuleGeometry args={[0.085, 0.26, 3, 8]} />
        <meshToonMaterial color={skin} />
      </mesh>
      {/* Sparkly shoe, overlapping the ankle so the leg reads as one piece. */}
      <mesh position={[0, -0.33, -0.04]}>
        <boxGeometry args={[0.19, 0.12, 0.24]} />
        <meshToonMaterial color="#ffd84d" />
      </mesh>
    </>
  )
}

function Arm({ skin }: { skin: string }) {
  return (
    <mesh position={[0, -0.16, 0]}>
      <capsuleGeometry args={[0.055, 0.22, 3, 8]} />
      <meshToonMaterial color={skin} />
    </mesh>
  )
}

function Head({ data }: { data: PrincessData }) {
  return (
    <group position={[0, 1.62, 0]}>
      <mesh>
        <sphereGeometry args={[0.23, 20, 16]} />
        <meshToonMaterial color={data.skin} />
      </mesh>

      {/* Face — she is built facing -z, so features sit on the -z side. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.085, 0.03, -0.2]}>
          <sphereGeometry args={[0.033, 8, 8]} />
          <meshBasicMaterial color="#3b2b3f" />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.145, -0.05, -0.175]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color="#ff9ec4" transparent opacity={0.75} />
        </mesh>
      ))}

      <Hair data={data} />
      <CrownHat color={data.crown} />
    </group>
  )
}

function Hair({ data }: { data: PrincessData }) {
  const cap = (
    <mesh position={[0, 0.05, 0.02]}>
      <sphereGeometry args={[0.245, 16, 14]} />
      <meshToonMaterial color={data.hair} />
    </mesh>
  )

  switch (data.hairStyle) {
    case 'buns':
      return (
        <group>
          {cap}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.24, 0.12, 0.05]}>
              <sphereGeometry args={[0.12, 12, 12]} />
              <meshToonMaterial color={data.hair} />
            </mesh>
          ))}
        </group>
      )
    case 'braid':
      return (
        <group>
          {cap}
          <mesh position={[0, -0.18, 0.2]}>
            <capsuleGeometry args={[0.07, 0.3, 3, 8]} />
            <meshToonMaterial color={data.hair} />
          </mesh>
        </group>
      )
    case 'long':
      return (
        <group>
          {cap}
          <mesh position={[0, -0.2, 0.12]} scale={[1, 1.4, 0.7]}>
            <sphereGeometry args={[0.22, 14, 12]} />
            <meshToonMaterial color={data.hair} />
          </mesh>
        </group>
      )
    case 'curls':
      return (
        <group>
          {cap}
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * 0.2, 0.1 + Math.sin(a) * 0.1, 0.12]}>
                <sphereGeometry args={[0.11, 10, 10]} />
                <meshToonMaterial color={data.hair} />
              </mesh>
            )
          })}
        </group>
      )
  }
}

function CrownHat({ color }: { color: string }) {
  return (
    <group position={[0, 0.26, 0.02]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.11, 0.028, 6, 14]} />
        <meshToonMaterial color={color} emissive="#6b5200" />
      </mesh>
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[i * 0.085, 0.055, 0]}>
          <coneGeometry args={[0.035, 0.09, 6]} />
          <meshToonMaterial color={color} emissive="#6b5200" />
        </mesh>
      ))}
    </group>
  )
}


