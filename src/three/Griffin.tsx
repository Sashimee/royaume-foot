import * as THREE from 'three'
import type { Keeper as KeeperData } from '../data/keepers'
import { useKeeperRig, useKeeperRigRefs } from './keeperRig'
import { KeeperFace } from './KeeperParts'

const INK = '#4a3520'

/**
 * The griffin: eagle in front, lion behind.
 *
 * His whole readability rests on the beak. Every other keeper has a rounded
 * face, so the one hard angular shape on the pitch is enough to name him from
 * the penalty spot — which is further than any amount of feather detail
 * survives.
 *
 * He has no smile for the same reason a beak cannot have one. The friendly
 * signal is carried entirely by the eyes, which is why they are drawn a size
 * larger here than on the others.
 */
export function Griffin({ data }: { data: KeeperData }) {
  const rig = useKeeperRigRefs()
  useKeeperRig(rig, { limbSwing: 0.5, limbSpeed: 3.4 })

  return (
    <group ref={rig.body}>
      <Legs data={data} />

      {/* Feathered chest, upright and broad. */}
      <mesh position={[0, 1.0, 0.02]} scale={[1.05, 1.1, 1]}>
        <sphereGeometry args={[0.52, 16, 14]} />
        <meshToonMaterial color={data.body} />
      </mesh>
      {/* Overlapping breast feathers, light against the body. */}
      {[0.66, 0.92, 1.16].map((y, i) => (
        <mesh key={y} position={[0, y, 0.42 - i * 0.03]} rotation={[0.3, 0, 0]} scale={[1.1, 1, 0.3]}>
          <sphereGeometry args={[0.2 - i * 0.02, 10, 8]} />
          <meshToonMaterial color={data.belly} />
        </mesh>
      ))}

      <group ref={rig.head}>
        <Head data={data} />
      </group>

      <group ref={rig.limbL} position={[-0.44, 1.2, -0.14]}>
        <Wing data={data} side={-1} />
      </group>
      <group ref={rig.limbR} position={[0.44, 1.2, -0.14]}>
        <Wing data={data} side={1} />
      </group>

      <group ref={rig.tail} position={[0, 0.78, -0.44]}>
        <Tail data={data} />
      </group>
    </group>
  )
}

function Legs({ data }: { data: KeeperData }) {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.29, 0, 0]}>
          <mesh position={[0, 0.44, -0.03]} rotation={[0.18, 0, 0]}>
            <capsuleGeometry args={[0.14, 0.28, 4, 10]} />
            <meshToonMaterial color={data.trim} />
          </mesh>
          <mesh position={[0, 0.16, 0.02]}>
            <capsuleGeometry args={[0.09, 0.14, 4, 8]} />
            <meshToonMaterial color={data.bodyDark} />
          </mesh>
          {/* Talons. */}
          {[-1, 0, 1].map((toe) => (
            <mesh key={toe} position={[toe * 0.09, 0.05, 0.2]} rotation={[0.4, 0, 0]}>
              <coneGeometry args={[0.05, 0.16, 6]} />
              <meshToonMaterial color={data.accent} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

function Head({ data }: { data: KeeperData }) {
  return (
    <group position={[0, 1.78, 0.16]}>
      <mesh scale={[1, 0.98, 1.05]}>
        <sphereGeometry args={[0.34, 16, 14]} />
        <meshToonMaterial color={data.belly} />
      </mesh>

      {/* The beak: two cones, upper and lower, with the upper overhanging. */}
      <mesh position={[0, -0.02, 0.34]} rotation={[Math.PI / 2.1, 0, 0]}>
        <coneGeometry args={[0.15, 0.34, 8]} />
        <meshToonMaterial color={data.accent} />
      </mesh>
      <mesh position={[0, -0.11, 0.29]} rotation={[Math.PI / 2.4, 0, 0]} scale={[0.85, 1, 0.6]}>
        <coneGeometry args={[0.12, 0.22, 8]} />
        <meshToonMaterial color={data.bodyDark} />
      </mesh>

      <KeeperFace ink={INK} eyeSpacing={0.17} eyeSize={0.13} y={0.09} z={0.2} />

      {/* Crown feathers, swept back. */}
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[i * 0.13, 0.29, -0.1]} rotation={[-0.6, 0, i * 0.35]}>
          <coneGeometry args={[0.055, 0.28, 6]} />
          <meshToonMaterial color={data.trim} />
        </mesh>
      ))}
      {/* Cheek ruff — where the feathered head meets the neck. */}
      {[-1, 1].map((side) => (
        <mesh key={`r${side}`} position={[side * 0.28, -0.08, -0.04]} rotation={[0, 0, side * -0.4]} scale={[1, 1, 0.4]}>
          <sphereGeometry args={[0.16, 8, 8]} />
          <meshToonMaterial color={data.body} />
        </mesh>
      ))}
    </group>
  )
}

/** Feathered rather than membraned: a fan of quills over a sector. */
function Wing({ data, side }: { data: KeeperData; side: number }) {
  return (
    <group rotation={[0, side * 0.22, 0]}>
      <mesh position={[side * 0.44, 0.06, 0]} rotation={[0, Math.PI / 2, side * 0.18]}>
        <circleGeometry args={[0.84, 10, Math.PI * 0.72, Math.PI * 0.72]} />
        <meshToonMaterial color={data.body} side={THREE.DoubleSide} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[side * (0.5 + i * 0.06), 0.16 - i * 0.2, 0.01]}
          rotation={[0, 0, side * (-1.0 - i * 0.22)]}
        >
          <capsuleGeometry args={[0.038, 0.6 - i * 0.06, 4, 6]} />
          <meshToonMaterial color={data.trim} />
        </mesh>
      ))}
    </group>
  )
}

/** A lion's tail, tuft and all — the half of him that is not a bird. */
function Tail({ data }: { data: KeeperData }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, -i * 0.14, -0.2 - i * 0.24]}>
          <capsuleGeometry args={[0.1 - i * 0.02, 0.2, 4, 8]} />
          <meshToonMaterial color={data.trim} />
        </mesh>
      ))}
      <mesh position={[0, -0.44, -0.86]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshToonMaterial color={data.bodyDark} />
      </mesh>
    </>
  )
}
