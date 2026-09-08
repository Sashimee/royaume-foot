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
 * units away: wings fanned open behind the shoulders, an S-curved neck that
 * lifts the head clear of the body, and a bright belly against a darker back
 * so he has some value contrast at that distance.
 *
 * Three earlier versions failed here. A single sphere with pebble wings; then
 * a better-proportioned one that collapsed into a green smudge because every
 * part of him was the same tone; then one whose wing membranes were turned
 * edge-on to the camera, so the widest part of him rendered as two thin blades
 * and he read as a green cow holding knives.
 *
 * **The membranes live in the XY plane and must stay there.** `keeperRig`
 * beats the side limbs about z, so a wing turned to face sideways both
 * disappears from the front and flaps the wrong way.
 */
export function Dragon({ data }: { data: KeeperData }) {
  const rig = useKeeperRigRefs()
  useKeeperRig(rig, { limbSwing: 0.3 })

  return (
    <group ref={rig.body}>
      {/* Wings first, so the body always wins the depth fight at the shoulder
          where the two overlap. */}
      <group ref={rig.limbL} position={[-0.34, 1.32, -0.3]}>
        <group scale={[-1, 1, 1]}>
          <Wing data={data} />
        </group>
      </group>
      <group ref={rig.limbR} position={[0.34, 1.32, -0.3]}>
        <Wing data={data} />
      </group>

      <Legs data={data} />

      {/* Barrel body, heavier low so he sits rather than floats. */}
      <mesh position={[0, 0.92, 0]} scale={[1, 1.04, 1.02]}>
        <sphereGeometry args={[0.56, 18, 14]} />
        <meshToonMaterial color={data.body} />
      </mesh>

      <Belly data={data} />

      {/* Ridge spikes down the spine. */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 1.34 - i * 0.24, -0.34 - i * 0.08]} rotation={[-0.55, 0, 0]}>
          <coneGeometry args={[0.09 - i * 0.012, 0.26 - i * 0.03, 6]} />
          <meshToonMaterial color={data.accent} />
        </mesh>
      ))}

      <Neck data={data} />
      <group ref={rig.head}>
        <Head data={data} />
      </group>

      <group ref={rig.tail} position={[0, 0.7, -0.44]}>
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
            <capsuleGeometry args={[0.16, 0.26, 4, 10]} />
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
 * The light front. This is the single most load-bearing piece of the whole
 * model at distance: it is the only thing that separates his front from his
 * back, and without it he is one flat green egg. It is one clean panel bulging
 * out of the chest, not a row of small pebbles — three little spheres on a
 * green body are three little spheres, not a belly. Plate seams were tried on
 * top of it and removed: at this size they read as grey ribs and muddied the
 * one shape that has to stay legible.
 */
function Belly({ data }: { data: KeeperData }) {
  // It has to bulge *out* of the chest. An earlier pass had it a hair smaller
  // than the body sphere, so the whole panel sat inside him and he went back to
  // being a flat green egg.
  return (
    <mesh position={[0, 0.86, 0.32]} scale={[0.86, 1.05, 0.7]}>
      <sphereGeometry args={[0.46, 16, 12]} />
      <meshToonMaterial color={data.belly} />
    </mesh>
  )
}

/**
 * An S-curve, not a straight stack: the segments lean forward and then back,
 * which lifts the head clear of the shoulders. A straight neck put the head
 * against the body outline and the whole animal became one lump. It tapers
 * hard — a neck as thick as the head is a bollard.
 */
function Neck({ data }: { data: KeeperData }) {
  const seg = [
    { y: 1.36, z: 0.16, r: 0.2, rot: 0.5 },
    { y: 1.58, z: 0.26, r: 0.165, rot: 0.2 },
    { y: 1.8, z: 0.3, r: 0.14, rot: -0.05 },
  ]
  return (
    <>
      {seg.map((s, i) => (
        <group key={i}>
          <mesh position={[0, s.y, s.z]} rotation={[s.rot, 0, 0]}>
            <capsuleGeometry args={[s.r, 0.14, 4, 10]} />
            <meshToonMaterial color={data.bodyDark} />
          </mesh>
          {/* The belly band carries on up the throat. Stopping it at the
              shoulders leaves a dark collar and cuts his head off at distance.
              Kept flat and tucked — proud of the neck it reads as a stack of
              pale blobs stuck to his front. */}
          <mesh position={[0, s.y, s.z + s.r * 0.6]} scale={[0.6, 1, 0.22]}>
            <sphereGeometry args={[s.r, 10, 8]} />
            <meshToonMaterial color={data.belly} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function Head({ data }: { data: KeeperData }) {
  return (
    <group position={[0, 2.06, 0.36]}>
      <mesh scale={[1, 0.95, 1.15]}>
        <sphereGeometry args={[0.34, 16, 14]} />
        <meshToonMaterial color={data.body} />
      </mesh>

      {/* Muzzle: a rounded box, not a cone — a cone reads as a beak. */}
      <mesh position={[0, -0.09, 0.32]} scale={[0.85, 0.7, 1]}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshToonMaterial color={data.bodyDark} />
      </mesh>
      {/* A jaw under it. Without one the muzzle floats and he looks toothless. */}
      <mesh position={[0, -0.2, 0.26]} scale={[0.7, 0.4, 0.85]}>
        <sphereGeometry args={[0.21, 10, 8]} />
        <meshToonMaterial color={data.belly} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.07, -0.03, 0.51]}>
          <sphereGeometry args={[0.032, 6, 6]} />
          <meshBasicMaterial color={INK} />
        </mesh>
      ))}

      {/* Brow ridges. Two wedges over the eyes are the whole difference between
          a friendly reptile and a frog. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.16, 0.21, 0.19]} rotation={[0.35, 0, side * 0.25]} scale={[1, 0.35, 0.5]}>
          <sphereGeometry args={[0.15, 10, 8]} />
          <meshToonMaterial color={data.bodyDark} />
        </mesh>
      ))}

      <KeeperFace ink={INK} y={0.09} z={0.26} />
      <KeeperSmile ink={INK} y={-0.16} z={0.38} />

      {/* Horns, swept back and big enough to break the head's outline — this is
          the pair of spikes that says "dragon" in a silhouette. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.18, 0.3, -0.08]} rotation={[-0.85, 0, side * 0.34]}>
          <coneGeometry args={[0.075, 0.44, 8]} />
          <meshToonMaterial color={data.accent} />
        </mesh>
      ))}
      {/* Cheek fins, swept back along the jaw. They used to be round frills,
          which read as cow ears and made him livestock. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.3, 0.02, -0.14]} rotation={[0.2, side * 0.5, side * 0.55]} scale={[1, 0.9, 0.16]}>
          <coneGeometry args={[0.17, 0.34, 4]} />
          <meshToonMaterial color={data.trim} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * A wing: a membrane fanned open from the shoulder, with finger bones along
 * its radii and a thumb claw at the leading tip.
 *
 * Modelled for the **right** side and mirrored for the left, so the two can
 * never drift apart. The whole fan sits in the XY plane, facing the camera:
 * this is the widest part of his silhouette and the reason he reads as a
 * keeper filling a goal rather than as scenery standing in it.
 */
const FINGERS = [
  { angle: 1.36, reach: 1.14 },
  { angle: 0.94, reach: 1.12 },
  { angle: 0.54, reach: 1.03 },
  { angle: 0.14, reach: 0.9 },
  { angle: -0.24, reach: 0.74 },
]

/**
 * The membrane, as one shape rather than a circular sector.
 *
 * The trailing edge is **scalloped** — it bows back towards the shoulder
 * between one fingertip and the next. A plain arc with bones drawn across it
 * reads as a palm leaf or a hand fan; the scallops are the entire difference
 * between that and a wing, and as a `Shape` they cost no extra draw call.
 */
const WING_SHAPE = (() => {
  const tips = FINGERS.map((f) => new THREE.Vector2(Math.cos(f.angle) * f.reach, Math.sin(f.angle) * f.reach))
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.lineTo(tips[0].x, tips[0].y)
  for (let i = 1; i < tips.length; i++) {
    const dip = tips[i - 1].clone().add(tips[i]).multiplyScalar(0.5 * 0.72)
    shape.quadraticCurveTo(dip.x, dip.y, tips[i].x, tips[i].y)
  }
  shape.lineTo(0, 0)
  return shape
})()

function Wing({ data }: { data: KeeperData }) {
  return (
    <group rotation={[0, -0.34, 0]}>
      <mesh>
        <shapeGeometry args={[WING_SHAPE, 14]} />
        <meshToonMaterial color={data.trim} side={THREE.DoubleSide} />
      </mesh>

      {/* Leading edge along the top, thicker than the rest: it is the bone the
          whole wing hangs from. */}
      {FINGERS.map((f, i) => (
        <Bone key={f.angle} data={data} angle={f.angle} length={f.reach} radius={i === 0 ? 0.052 : 0.03} />
      ))}

      {/* Thumb claw at the leading tip, the way a bat's wing carries one. */}
      <mesh
        position={[Math.cos(FINGERS[0].angle) * FINGERS[0].reach, Math.sin(FINGERS[0].angle) * FINGERS[0].reach, 0]}
        rotation={[0, 0, FINGERS[0].angle - Math.PI / 2]}
      >
        <coneGeometry args={[0.05, 0.17, 6]} />
        <meshToonMaterial color={data.accent} />
      </mesh>
    </group>
  )
}

/** One wing bone, laid from the shoulder outwards along a radius of the fan. */
function Bone({ data, angle, length, radius }: { data: KeeperData; angle: number; length: number; radius: number }) {
  return (
    <mesh
      position={[(Math.cos(angle) * length) / 2, (Math.sin(angle) * length) / 2, 0.012]}
      rotation={[0, 0, angle - Math.PI / 2]}
    >
      <capsuleGeometry args={[radius, length - radius * 2, 4, 8]} />
      <meshToonMaterial color={data.bodyDark} />
    </mesh>
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
