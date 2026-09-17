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
      {/* Overlapping breast feathers. A shade off the body, not the head's
          white: the white has to belong to the head alone or it stops being
          the thing that names him. */}
      {[0.66, 0.92, 1.16].map((y, i) => (
        <mesh key={y} position={[0, y, 0.42 - i * 0.03]} rotation={[0.3, 0, 0]} scale={[1.1, 1, 0.3]}>
          <sphereGeometry args={[0.2 - i * 0.02, 10, 8]} />
          <meshToonMaterial color={data.trim} />
        </mesh>
      ))}

      <group ref={rig.head}>
        <Head data={data} />
      </group>

      <group ref={rig.limbL} position={[-0.42, 1.34, -0.14]}>
        <Wing data={data} side={-1} />
      </group>
      <group ref={rig.limbR} position={[0.42, 1.34, -0.14]}>
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

      {/* The beak. Four-sided, so every edge is a hard line no other keeper has,
          and angled down rather than out: a beak pointed at the camera
          foreshortens into a button nose, which is what it read as. */}
      <mesh position={[0, -0.02, 0.28]} rotation={[Math.PI / 1.78, 0, 0]}>
        <coneGeometry args={[0.2, 0.52, 4]} />
        <meshToonMaterial color={data.accent} />
      </mesh>
      {/* The hook, sunk into the beak's tip. An eagle is the curl at the end of
          the beak more than it is the beak. */}
      <mesh position={[0, -0.1, 0.48]} rotation={[Math.PI, 0, Math.PI / 4]}>
        <coneGeometry args={[0.11, 0.2, 4]} />
        <meshToonMaterial color={data.accent} />
      </mesh>

      <KeeperFace ink={INK} eyeSpacing={0.19} eyeSize={0.13} y={0.13} z={0.22} />

      {/* Crown feathers, swept back. Kept the head's own white, so they ruffle
          its outline instead of drawing a dark mohawk across it. */}
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[i * 0.13, 0.29, -0.1]} rotation={[-0.6, 0, i * 0.35]}>
          <coneGeometry args={[0.055, 0.28, 6]} />
          <meshToonMaterial color={data.belly} />
        </mesh>
      ))}
      {/* Cheek ruff — where the feathered head meets the neck. */}
      {[-1, 1].map((side) => (
        <mesh key={`r${side}`} position={[side * 0.28, -0.08, -0.04]} rotation={[0, 0, side * -0.4]} scale={[1, 1, 0.4]}>
          <sphereGeometry args={[0.16, 8, 8]} />
          <meshToonMaterial color={data.belly} />
        </mesh>
      ))}
    </group>
  )
}

/** Angle from +x and length of each primary, outermost first. */
const PRIMARIES: [number, number][] = [
  [0.3, 0.94],
  [0.12, 1.02],
  [-0.07, 0.98],
  [-0.27, 0.84],
  [-0.5, 0.66],
]

/**
 * A fan of separate primary feathers rather than one sector.
 *
 * A solid sector has a smooth outer edge, and a smooth edge on a flat shape
 * reads as a fin: he looked like a bird with two palm fronds stuck to him.
 * Overlapping quills notch that edge, and the notches are the only part of a
 * wing that survives twenty-five units.
 *
 * The fan lies in the **XY plane**, facing the camera, like the dragon's. It
 * was turned `Math.PI / 2` about y — the same mistake the dragon's membranes
 * carried for two releases — so both wings rendered edge-on as thin blades and
 * he read as a tan chick with sticks behind it.
 *
 * Scaled to keep his span inside the dragon's. A wing that faces the camera is
 * suddenly as wide as it always claimed to be, and the keep-mode shooter
 * stands where only so much fits on screen — see `KEEP.shooterHalfWidth`.
 */
function Wing({ data, side }: { data: KeeperData; side: number }) {
  return (
    <group rotation={[0, side * 0.22, 0]} scale={0.78}>
      {PRIMARIES.map(([angle, length], i) => {
        const a = side < 0 ? Math.PI - angle : angle
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * length * 0.5, Math.sin(a) * length * 0.5, -i * 0.012]}
            rotation={[0, 0, a - Math.PI / 2]}
          >
            <capsuleGeometry args={[0.15, length, 4, 8]} />
            <meshToonMaterial color={data.body} />
          </mesh>
        )
      })}
      {/* Coverts over the roots, dark: without them the quills read as five
          loose sausages rather than one wing. */}
      <mesh position={[side * 0.22, 0.02, 0.06]} scale={[0.62, 0.42, 0.18]}>
        <sphereGeometry args={[0.6, 12, 10]} />
        <meshToonMaterial color={data.bodyDark} />
      </mesh>
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
