import type { Keeper as KeeperData } from '../data/keepers'
import { useKeeperRig, useKeeperRigRefs } from './keeperRig'
import { KeeperFace, KeeperSmile } from './KeeperParts'

const INK = '#3f5566'

/** Angle and length of each tuft, over the shoulders and along the hem. */
const SHOULDER_FUR: [number, number][] = [
  [0.22, 0.3],
  [0.6, 0.36],
  [1.0, 0.28],
  [2.14, 0.28],
  [2.54, 0.36],
  [2.92, 0.3],
]
const HEM_FUR: [number, number][] = [
  [3.62, 0.26],
  [4.2, 0.3],
  [5.1, 0.3],
  [5.68, 0.26],
]

/**
 * The yeti.
 *
 * The only keeper with proper arms, and they are held wide — he is the one who
 * looks most like what a child has actually seen a goalkeeper do. That is his
 * whole reason for existing: after three animals, the pose itself becomes the
 * novelty.
 *
 * He is built stocky and low. A tall yeti at this scale would poke above the
 * crossbar and quietly tell a child the goal is smaller than it is.
 */
export function Yeti({ data }: { data: KeeperData }) {
  const rig = useKeeperRigRefs()
  useKeeperRig(rig, { limbSwing: 0.16, limbSpeed: 2.2 })

  return (
    <group ref={rig.body}>
      <Legs data={data} />

      {/* Heavy shoulders over a narrower hip. One sphere made him a snowman:
          the taper is what says ape, and it survives to the penalty spot where
          fur texture does not. */}
      <mesh position={[0, 1.3, 0]} scale={[1.34, 0.86, 0.92]}>
        <sphereGeometry args={[0.62, 16, 14]} />
        <meshToonMaterial color={data.body} />
      </mesh>
      <mesh position={[0, 0.82, 0.02]} scale={[1.02, 0.94, 0.9]}>
        <sphereGeometry args={[0.5, 14, 12]} />
        <meshToonMaterial color={data.body} />
      </mesh>
      {/* The fur. Cones on the outline, not bumps inside it: the tufts used to
          be spheres sunk in the body, where a silhouette never sees them. */}
      {SHOULDER_FUR.map(([angle, length], i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * 0.82, 1.3 + Math.sin(angle) * 0.52, -0.05]}
          rotation={[0, 0, angle - Math.PI / 2]}
        >
          <coneGeometry args={[0.15, length, 5]} />
          <meshToonMaterial color={data.body} />
        </mesh>
      ))}
      {HEM_FUR.map(([angle, length], i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * 0.5, 0.82 + Math.sin(angle) * 0.46, -0.02]}
          rotation={[0, 0, angle - Math.PI / 2]}
        >
          <coneGeometry args={[0.13, length, 5]} />
          <meshToonMaterial color={data.body} />
        </mesh>
      ))}
      {/* Chest fur, white against the blue-grey coat. It has to stand proud of
          the shoulder sphere's own front face or it sits inside him and simply
          is not there — which is where it was. */}
      <mesh position={[0, 0.98, 0.44]} scale={[0.92, 1.0, 0.26]}>
        <sphereGeometry args={[0.4, 12, 10]} />
        <meshToonMaterial color={data.belly} />
      </mesh>

      <group ref={rig.head}>
        <Head data={data} />
      </group>

      <group ref={rig.limbL} position={[-0.6, 1.5, 0.02]}>
        <Arm data={data} side={-1} />
      </group>
      <group ref={rig.limbR} position={[0.6, 1.5, 0.02]}>
        <Arm data={data} side={1} />
      </group>
    </group>
  )
}

function Legs({ data }: { data: KeeperData }) {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.3, 0, 0]}>
          <mesh position={[0, 0.4, 0]}>
            <capsuleGeometry args={[0.2, 0.3, 4, 10]} />
            <meshToonMaterial color={data.body} />
          </mesh>
          {/* Big flat feet, turned out. A yeti with neat feet is a bear. */}
          <mesh position={[side * 0.04, 0.11, 0.14]} rotation={[0, side * 0.3, 0]} scale={[1, 0.55, 1.5]}>
            <sphereGeometry args={[0.19, 10, 8]} />
            <meshToonMaterial color={data.bodyDark} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function Head({ data }: { data: KeeperData }) {
  return (
    <group position={[0, 1.86, 0.12]}>
      <mesh scale={[1.05, 0.95, 1]}>
        <sphereGeometry args={[0.36, 16, 14]} />
        <meshToonMaterial color={data.body} />
      </mesh>
      {/* A pale face patch, so the eyes have something to sit on. */}
      <mesh position={[0, -0.02, 0.2]} scale={[0.85, 0.8, 0.5]}>
        <sphereGeometry args={[0.3, 12, 10]} />
        <meshToonMaterial color={data.belly} />
      </mesh>

      <KeeperFace ink={INK} eyeSpacing={0.16} eyeSize={0.115} y={0.06} z={0.28} />
      {/* A wide open grin — he is the friendliest thing in the goal. */}
      <KeeperSmile ink={INK} width={0.12} y={-0.14} z={0.35} />
      <mesh position={[0, 0.0, 0.36]} scale={[1, 0.7, 0.7]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshToonMaterial color={data.accent} />
      </mesh>

      {/* Two small horns, which is what keeps him from being a gorilla. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.2, 0.3, -0.02]} rotation={[-0.3, 0, side * 0.4]}>
          <coneGeometry args={[0.06, 0.2, 7]} />
          <meshToonMaterial color={data.accent} />
        </mesh>
      ))}
      {/* Brow tufts, tilted so the *inner* ends ride high. They were tilted the
          other way, which is the one shape a brow has that means angry, and at
          twenty-five units a scowl is the only thing about him that survives
          the distance. Rule 3 is not just about what the game does to you. */}
      {[-1, 1].map((side) => (
        <mesh key={`b${side}`} position={[side * 0.17, 0.21, 0.2]} rotation={[0, 0, side * -0.16]} scale={[1.4, 0.6, 0.6]}>
          <sphereGeometry args={[0.08, 8, 6]} />
          <meshToonMaterial color={data.trim} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Held out and slightly down, the way someone bracing to catch a ball holds
 * them — and long. Short arms on a round body read as a snowsuit; an arm that
 * reaches past the hip is the thing that says ape.
 */
function Arm({ data, side }: { data: KeeperData; side: number }) {
  return (
    <group rotation={[0, 0, side * -0.62]}>
      {/* A shade under the torso. Same colour as the body and the arm vanished
          into the shoulder, leaving one wide pale poncho. */}
      <mesh position={[side * 0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.19, 0.62, 4, 10]} />
        <meshToonMaterial color={data.bodyDark} />
      </mesh>
      {/* Shaggy edge along the forearm, cut as points so the underside of the
          arm is ragged rather than piped. */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[side * (0.14 + i * 0.18), -0.24, -0.02]} rotation={[0, 0, Math.PI + side * 0.4]}>
          <coneGeometry args={[0.13, 0.26, 5]} />
          <meshToonMaterial color={data.body} />
        </mesh>
      ))}
      {/* Open hand. */}
      <mesh position={[side * 0.72, -0.04, 0.02]} scale={[1, 1.05, 0.9]}>
        <sphereGeometry args={[0.21, 10, 8]} />
        <meshToonMaterial color={data.trim} />
      </mesh>
      {[-1, 0, 1].map((f) => (
        <mesh key={f} position={[side * 0.87, 0.02 + f * 0.12, 0.03]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.05, 0.1, 4, 6]} />
          <meshToonMaterial color={data.trim} />
        </mesh>
      ))}
    </group>
  )
}
