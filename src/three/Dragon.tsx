import * as THREE from 'three'
import type { Keeper as KeeperData } from '../data/keepers'
import { useKeeperRig, useKeeperRigRefs } from './keeperRig'
import { KeeperFace, KeeperSmile } from './KeeperParts'

const INK = '#3c6b47'

/**
 * The dragon. He keeps goal in shooting mode and takes the shots in keeping
 * mode, so he is on screen in both.
 *
 * Built to read as a *silhouette* from the penalty spot, which is twenty-five
 * units away: an S-curved neck that lifts the head clear of the body, wings
 * held open above the crossbar line, and a bright belly band against a darker
 * back so he has some value contrast at that distance. Two earlier versions
 * failed here — a single sphere with pebble wings, then a better-proportioned
 * one that still collapsed into a green smudge because every part of him was
 * the same tone.
 *
 * The open stance is doing a job, not decorating: it is what makes him read as
 * a *keeper* rather than as scenery standing in the goal.
 */
export function Dragon({ data }: { data: KeeperData }) {
  const rig = useKeeperRigRefs()
  useKeeperRig(rig, { limbSwing: 0.55 })

  return (
    <group ref={rig.body}>
      <Legs data={data} />

      {/* Barrel body, deeper than it is wide so it reads side-on too. */}
      <mesh position={[0, 0.95, 0]} scale={[1, 1.05, 1.18]}>
        <sphereGeometry args={[0.55, 18, 14]} />
        <meshToonMaterial color={data.body} />
      </mesh>

      {/* Belly plates. The light band is what separates front from back, and
          at distance it is the only thing that does. */}
      {[0.62, 0.9, 1.18].map((y, i) => (
        <mesh key={y} position={[0, y, 0.5 - i * 0.04]} rotation={[0.25, 0, 0]} scale={[1, 1, 0.35]}>
          <sphereGeometry args={[0.22 - i * 0.02, 10, 8]} />
          <meshToonMaterial color={data.belly} />
        </mesh>
      ))}

      {/* Ridge spikes down the spine. */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 1.35 - i * 0.22, -0.28 - i * 0.1]} rotation={[-0.5, 0, 0]}>
          <coneGeometry args={[0.08 - i * 0.012, 0.22 - i * 0.03, 6]} />
          <meshToonMaterial color={data.accent} />
        </mesh>
      ))}

      <Neck data={data} />
      <group ref={rig.head}>
        <Head data={data} />
      </group>

      <group ref={rig.limbL} position={[-0.46, 1.15, -0.12]}>
        <Wing data={data} side={-1} />
      </group>
      <group ref={rig.limbR} position={[0.46, 1.15, -0.12]}>
        <Wing data={data} side={1} />
      </group>

      <group ref={rig.tail} position={[0, 0.72, -0.42]}>
        <Tail data={data} />
      </group>
    </group>
  )
}

function Legs({ data }: { data: KeeperData }) {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.3, 0, 0]} rotation={[0, 0, side * -0.12]}>
          {/* Thigh, angled — a straight cylinder reads as a peg. */}
          <mesh position={[0, 0.42, -0.04]} rotation={[0.2, 0, 0]}>
            <capsuleGeometry args={[0.15, 0.26, 4, 10]} />
            <meshToonMaterial color={data.body} />
          </mesh>
          <mesh position={[0, 0.16, 0.02]}>
            <capsuleGeometry args={[0.1, 0.14, 4, 8]} />
            <meshToonMaterial color={data.bodyDark} />
          </mesh>
          {/* Foot with visible toes. */}
          <mesh position={[0, 0.07, 0.14]}>
            <sphereGeometry args={[0.15, 10, 8]} />
            <meshToonMaterial color={data.bodyDark} />
          </mesh>
          {[-1, 0, 1].map((toe) => (
            <mesh key={toe} position={[toe * 0.08, 0.05, 0.26]}>
              <sphereGeometry args={[0.055, 8, 6]} />
              <meshToonMaterial color={data.accent} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

/**
 * An S-curve, not a straight stack: the segments lean forward and then back,
 * which lifts the head clear of the shoulders. A straight neck put the head
 * against the body outline and the whole animal became one lump.
 */
function Neck({ data }: { data: KeeperData }) {
  const lean = [0.62, 0.4, 0.12]
  return (
    <>
      {lean.map((rot, i) => (
        <mesh key={i} position={[0, 1.3 + i * 0.21, 0.14 + i * 0.09]} rotation={[rot, 0, 0]}>
          <capsuleGeometry args={[0.2 - i * 0.025, 0.13, 4, 10]} />
          <meshToonMaterial color={i === 0 ? data.body : data.bodyDark} />
        </mesh>
      ))}
    </>
  )
}

function Head({ data }: { data: KeeperData }) {
  return (
    <group position={[0, 2.02, 0.42]}>
      <mesh scale={[1, 0.95, 1.15]}>
        <sphereGeometry args={[0.33, 16, 14]} />
        <meshToonMaterial color={data.body} />
      </mesh>

      {/* Muzzle: a rounded box, not a cone — a cone reads as a beak. */}
      <mesh position={[0, -0.08, 0.32]} scale={[0.85, 0.7, 1]}>
        <sphereGeometry args={[0.21, 12, 10]} />
        <meshToonMaterial color={data.bodyDark} />
      </mesh>
      {/* A jaw under it. Without one the muzzle floats and he looks toothless. */}
      <mesh position={[0, -0.19, 0.26]} scale={[0.7, 0.4, 0.85]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshToonMaterial color={data.belly} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.07, -0.02, 0.5]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshBasicMaterial color={INK} />
        </mesh>
      ))}

      <KeeperFace ink={INK} y={0.11} z={0.24} />
      <KeeperSmile ink={INK} y={-0.15} z={0.38} />

      {/* Horns swept back, and a pair of ear frills. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.17, 0.27, -0.06]} rotation={[-0.7, 0, side * 0.3]}>
          <coneGeometry args={[0.06, 0.32, 8]} />
          <meshToonMaterial color={data.accent} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.31, 0.04, -0.06]} rotation={[0, 0, side * -0.5]} scale={[1, 1, 0.25]}>
          <circleGeometry args={[0.18, 8, Math.PI * 0.1, Math.PI * 0.8]} />
          <meshToonMaterial color={data.trim} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * A wing: a fanned membrane (a circle *sector*, which is exactly the shape
 * wanted) with finger bones across it. Held high and open — this is the widest
 * part of his silhouette and the reason he reads as a keeper filling a goal.
 */
function Wing({ data, side }: { data: KeeperData; side: number }) {
  return (
    <group rotation={[0, side * 0.25, 0]}>
      <mesh position={[side * 0.46, 0.08, 0]} rotation={[0, Math.PI / 2, side * 0.2]}>
        <circleGeometry args={[0.86, 10, Math.PI * 0.72, Math.PI * 0.72]} />
        <meshToonMaterial color={data.trim} side={THREE.DoubleSide} />
      </mesh>
      {/* Leading edge and two fingers. */}
      <mesh position={[side * 0.38, 0.2, 0]} rotation={[0, 0, side * -0.9]}>
        <capsuleGeometry args={[0.045, 0.68, 4, 8]} />
        <meshToonMaterial color={data.bodyDark} />
      </mesh>
      {[0.35, 0.75].map((f) => (
        <mesh key={f} position={[side * 0.46, -0.05 - f * 0.18, 0]} rotation={[0, 0, side * (-1.25 - f * 0.35)]}>
          <capsuleGeometry args={[0.03, 0.54, 4, 6]} />
          <meshToonMaterial color={data.bodyDark} />
        </mesh>
      ))}
    </group>
  )
}

function Tail({ data }: { data: KeeperData }) {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, -i * 0.11, -0.22 - i * 0.26]}>
          <sphereGeometry args={[0.2 - i * 0.035, 10, 8]} />
          <meshToonMaterial color={i % 2 === 0 ? data.body : data.bodyDark} />
        </mesh>
      ))}
      {/* Spade tip. */}
      <mesh position={[0, -0.46, -1.32]} rotation={[Math.PI / 2.2, 0, 0]}>
        <coneGeometry args={[0.16, 0.3, 8]} />
        <meshToonMaterial color={data.accent} />
      </mesh>
    </>
  )
}
