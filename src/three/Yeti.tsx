import type { Keeper as KeeperData } from '../data/keepers'
import { useKeeperRig, useKeeperRigRefs } from './keeperRig'
import { KeeperFace, KeeperSmile } from './KeeperParts'

const INK = '#3f5566'

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

      {/* One broad shaggy mass. The fur tufts around its edge are what stop it
          reading as a snowman. */}
      <mesh position={[0, 1.06, 0]} scale={[1.18, 1.05, 1]}>
        <sphereGeometry args={[0.6, 16, 14]} />
        <meshToonMaterial color={data.body} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.62, 1.06 + Math.sin(a) * 0.5, -0.05]} scale={[1, 1, 0.6]}>
            <sphereGeometry args={[0.19, 8, 8]} />
            <meshToonMaterial color={data.bodyDark} />
          </mesh>
        )
      })}
      {/* Chest fur, lighter. */}
      <mesh position={[0, 0.94, 0.42]} scale={[1, 1.15, 0.4]}>
        <sphereGeometry args={[0.32, 12, 10]} />
        <meshToonMaterial color={data.belly} />
      </mesh>

      <group ref={rig.head}>
        <Head data={data} />
      </group>

      <group ref={rig.limbL} position={[-0.66, 1.3, 0]}>
        <Arm data={data} side={-1} />
      </group>
      <group ref={rig.limbR} position={[0.66, 1.3, 0]}>
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
      {/* Brow tufts. */}
      {[-1, 1].map((side) => (
        <mesh key={`b${side}`} position={[side * 0.17, 0.19, 0.2]} rotation={[0, 0, side * 0.3]} scale={[1.4, 0.6, 0.6]}>
          <sphereGeometry args={[0.08, 8, 6]} />
          <meshToonMaterial color={data.trim} />
        </mesh>
      ))}
    </group>
  )
}

/** Held out and slightly down, the way someone bracing to catch a ball holds them. */
function Arm({ data, side }: { data: KeeperData; side: number }) {
  return (
    <group rotation={[0, 0, side * -0.55]}>
      <mesh position={[side * 0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.17, 0.42, 4, 10]} />
        <meshToonMaterial color={data.body} />
      </mesh>
      {/* Shaggy edge along the forearm. */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[side * (0.14 + i * 0.16), -0.13, 0]} scale={[1, 0.8, 0.7]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshToonMaterial color={data.bodyDark} />
        </mesh>
      ))}
      {/* Open hand. */}
      <mesh position={[side * 0.53, -0.04, 0.02]}>
        <sphereGeometry args={[0.19, 10, 8]} />
        <meshToonMaterial color={data.trim} />
      </mesh>
      {[-1, 0, 1].map((f) => (
        <mesh key={f} position={[side * 0.66, 0.02 + f * 0.11, 0.03]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.045, 0.1, 4, 6]} />
          <meshToonMaterial color={data.trim} />
        </mesh>
      ))}
    </group>
  )
}
