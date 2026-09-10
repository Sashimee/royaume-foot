import * as THREE from 'three'
import type { Accessory as AccessoryData } from '../data/accessories'

/**
 * The one thing the child has chosen to wear, drawn on top of a princess or a
 * knight without either of them knowing which it got — the same bargain the
 * roster's `<Character>` makes.
 *
 * Both mounts are drawn around their own origin: the parent places the group at
 * the top of the head or between the shoulders, because a princess and a knight
 * are not the same height. Everything is modelled facing **-z** like the
 * characters, so a back item sits on +z and a face-on detail points at -z.
 *
 * Nothing here animates. The body underneath is already moving on the shared
 * rig, and a second loop would be one more thing to remember to gate behind
 * `reducedMotion`.
 */
export function Accessory({ data, mount }: { data: AccessoryData; mount: 'head' | 'back' }) {
  if (data.mount !== mount) return null

  switch (data.kind) {
    case 'fairy':
      return <FairyWings data={data} />
    case 'butterfly':
      return <ButterflyWings data={data} />
    case 'cape':
      return <StarCape data={data} />
    case 'dragon':
      return <DragonWings data={data} />
    case 'flowers':
      return <FlowerCrown data={data} />
    case 'crown':
      return <BigCrown data={data} />
    case 'tiara':
      return <Tiara data={data} />
    case 'party':
      return <PartyHat data={data} />
    case 'none':
      return null
  }
}

const SIDES = [-1, 1]

/** Flat and translucent, four petals that read as wings from behind. */
function FairyWings({ data }: { data: AccessoryData }) {
  return (
    <group>
      {SIDES.map((side) => (
        <group key={side} scale={[side, 1, 1]}>
          <mesh position={[0.34, 0.2, 0.06]} rotation={[0, 0, -0.35]} scale={[1, 1.45, 0.1]}>
            <sphereGeometry args={[0.3, 12, 10]} />
            <meshToonMaterial color={data.main} transparent opacity={0.78} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.3, -0.17, 0.06]} rotation={[0, 0, 0.4]} scale={[1, 1.2, 0.1]}>
            <sphereGeometry args={[0.2, 12, 10]} />
            <meshToonMaterial color={data.accent} transparent opacity={0.78} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Bigger, opaque and two-tone — the widest silhouette in the set. */
function ButterflyWings({ data }: { data: AccessoryData }) {
  return (
    <group>
      {SIDES.map((side) => (
        <group key={side} scale={[side, 1, 1]}>
          <mesh position={[0.4, 0.19, 0.06]} rotation={[0, 0, -0.25]} scale={[1, 1.3, 0.08]}>
            <sphereGeometry args={[0.32, 12, 10]} />
            <meshToonMaterial color={data.main} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.34, -0.19, 0.06]} rotation={[0, 0, 0.3]} scale={[1, 1.15, 0.08]}>
            <sphereGeometry args={[0.24, 12, 10]} />
            <meshToonMaterial color={data.accent} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.42, 0.24, 0.09]} scale={[1, 1, 0.3]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color={data.accent} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/**
 * A cylinder wedge hung from the shoulders, the same construction as the
 * knight's own cape: theta is measured from +z, so a wedge centred on 0 falls
 * down the back. Swinging it towards -z drapes it over the face.
 */
function StarCape({ data }: { data: AccessoryData }) {
  return (
    <group>
      <mesh position={[0, -0.28, 0.06]}>
        <cylinderGeometry args={[0.3, 0.5, 0.95, 14, 1, true, -Math.PI * 0.42, Math.PI * 0.84]} />
        <meshToonMaterial color={data.main} side={THREE.DoubleSide} />
      </mesh>
      {[
        [-0.16, -0.16],
        [0.15, -0.34],
        [-0.05, -0.52],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.47]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.06, 0.02, 5]} />
          <meshBasicMaterial color={data.accent} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Membranes as circle sectors, which lie in the XY plane and therefore face the
 * camera. The keeper dragon's wings were rotated about y for two releases and
 * rendered as two thin blades — this is that lesson, in the wardrobe.
 */
function DragonWings({ data }: { data: AccessoryData }) {
  return (
    <group>
      {SIDES.map((side) => (
        <group key={side} scale={[side, 1, 1]}>
          <mesh position={[0.1, 0.0, 0.07]}>
            <circleGeometry args={[0.52, 16, -Math.PI * 0.12, Math.PI * 0.55]} />
            <meshToonMaterial color={data.main} side={THREE.DoubleSide} />
          </mesh>
          {/* Ribs. A bare sector is a green shape; the fingers are what make a
              child read it as a wing, which is the same cue the keeper dragon
              needed at this distance. */}
          {[-0.1, 0.14, 0.4].map((turns) => {
            const a = Math.PI * turns
            return (
              <mesh
                key={turns}
                position={[0.1 + Math.cos(a) * 0.26, Math.sin(a) * 0.26, 0.085]}
                rotation={[0, 0, a - Math.PI / 2]}
              >
                <capsuleGeometry args={[0.018, 0.48, 3, 6]} />
                <meshToonMaterial color={data.accent} />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

/** Five blooms on a stem ring, sitting where the princess's crown would. */
function FlowerCrown({ data }: { data: AccessoryData }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.03, 6, 16]} />
        <meshToonMaterial color={data.accent} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.2, 0.05, Math.sin(a) * 0.2]} scale={[1, 0.7, 1]}>
            <sphereGeometry args={[0.095, 10, 8]} />
            <meshToonMaterial color={data.main} />
          </mesh>
        )
      })}
    </group>
  )
}

/** The full-size version of the crown a princess is born with. */
function BigCrown({ data }: { data: AccessoryData }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.05, 6, 16]} />
        <meshToonMaterial color={data.main} emissive="#6b5200" />
      </mesh>
      {[-2, -1, 0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.095, 0.14 - Math.abs(i) * 0.03, 0]}>
          <coneGeometry args={[0.058, 0.24 - Math.abs(i) * 0.045, 6]} />
          <meshToonMaterial color={i === 0 ? data.accent : data.main} emissive="#6b5200" />
        </mesh>
      ))}
    </group>
  )
}

/** A band with one big star at the front — she is built facing -z. */
function Tiara({ data }: { data: AccessoryData }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.032, 6, 16, Math.PI * 1.2]} />
        <meshToonMaterial color={data.main} />
      </mesh>
      <mesh position={[0, 0.17, -0.13]} rotation={[Math.PI * 0.32, 0, 0]}>
        <coneGeometry args={[0.16, 0.035, 5]} />
        <meshBasicMaterial color={data.accent} />
      </mesh>
      {SIDES.map((side) => (
        <mesh key={side} position={[side * 0.17, 0.02, -0.07]}>
          <sphereGeometry args={[0.042, 8, 8]} />
          <meshBasicMaterial color={data.accent} />
        </mesh>
      ))}
    </group>
  )
}

/** A striped cone with a pompom, the one item that is pure silliness. */
function PartyHat({ data }: { data: AccessoryData }) {
  return (
    <group>
      <mesh position={[0, 0.16, 0]} rotation={[0.12, 0, 0]}>
        <coneGeometry args={[0.17, 0.44, 14]} />
        <meshToonMaterial color={data.main} />
      </mesh>
      {[0.06, 0.19].map((y, i) => (
        <mesh key={i} position={[0, y, 0.01]} rotation={[Math.PI / 2 + 0.12, 0, 0]}>
          <torusGeometry args={[0.147 - i * 0.048, 0.018, 6, 16]} />
          <meshToonMaterial color={data.accent} />
        </mesh>
      ))}
      <mesh position={[0, 0.44, -0.05]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshToonMaterial color={data.accent} />
      </mesh>
    </group>
  )
}
