import type { Keeper as KeeperData } from '../data/keepers'
import { useKeeperRig, useKeeperRigRefs } from './keeperRig'
import { KeeperFace, KeeperSmile } from './KeeperParts'

const INK = '#6b4a86'

/**
 * The unicorn.
 *
 * Deliberately the opposite shape to the dragon: a *horizontal* barrel on four
 * legs with a tall neck rising out of it, where he is a vertical lump with
 * wings. Two keepers that share a silhouette are one keeper wearing two
 * palettes, and the whole point of the species split was that a child should
 * be able to tell at a glance who is in goal today.
 *
 * The mane is her width. She has no wings to fill the goal with, so the mane
 * and tail are drawn generously — they are what stops her reading as small.
 *
 * Generously, and **to the sides**. Both were first drawn down the back of the
 * neck and behind the barrel, which is anatomically right and invisible: every
 * species faces +z, so the only view that exists put the neck in front of the
 * mane and the body in front of the tail. `trim` never reached the screen at
 * all and she read as a white blob on four sticks.
 */
export function Unicorn({ data }: { data: KeeperData }) {
  const rig = useKeeperRigRefs()
  useKeeperRig(rig, { limbSwing: 0.12, limbSpeed: 2.6 })

  return (
    <group ref={rig.body}>
      <Legs data={data} />

      {/* Barrel, lying along z. */}
      <mesh position={[0, 1.02, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.44, 0.62, 6, 16]} />
        <meshToonMaterial color={data.body} />
      </mesh>
      {/* Belly band. */}
      <mesh position={[0, 0.74, -0.05]} rotation={[Math.PI / 2, 0, 0]} scale={[0.9, 1, 0.5]}>
        <capsuleGeometry args={[0.34, 0.52, 4, 12]} />
        <meshToonMaterial color={data.belly} />
      </mesh>

      <Neck data={data} />
      <group ref={rig.head}>
        <Head data={data} rig={rig} />
      </group>

      <group ref={rig.tail} position={[0, 1.06, -0.62]}>
        <Tail data={data} />
      </group>
    </group>
  )
}

function Legs({ data }: { data: KeeperData }) {
  // Four legs, the front pair planted wider — a horse standing square reads as
  // a rocking-horse, and a keeper should look ready to move.
  const legs: [number, number, number][] = [
    [-0.28, 0, 0.3],
    [0.28, 0, 0.3],
    [-0.24, 0, -0.42],
    [0.24, 0, -0.42],
  ]
  return (
    <>
      {legs.map(([x, , z]) => (
        <group key={`${x}:${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.44, 0]}>
            <capsuleGeometry args={[0.11, 0.5, 4, 10]} />
            <meshToonMaterial color={data.body} />
          </mesh>
          {/* Hoof. */}
          <mesh position={[0, 0.11, 0.01]}>
            <cylinderGeometry args={[0.12, 0.13, 0.16, 10]} />
            <meshToonMaterial color={data.accent} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function Neck({ data }: { data: KeeperData }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 1.3 + i * 0.22, 0.24 + i * 0.05]} rotation={[0.18, 0, 0]}>
          <capsuleGeometry args={[0.19 - i * 0.02, 0.16, 4, 10]} />
          <meshToonMaterial color={data.body} />
        </mesh>
      ))}
      {/* Mane in overlapping tufts, each one wider than the neck it sits behind
          so it reads as a fringe down both sides rather than a stripe nobody
          can see. */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`m${i}`} position={[0, 1.34 + i * 0.2, 0.06 + i * 0.03]} rotation={[0.4, 0, 0]} scale={[1.9, 1.05, 0.5]}>
          <sphereGeometry args={[0.19, 10, 8]} />
          <meshToonMaterial color={data.trim} />
        </mesh>
      ))}
    </>
  )
}

function Head({ data, rig }: { data: KeeperData; rig: ReturnType<typeof useKeeperRigRefs> }) {
  return (
    // Scaled as a whole rather than sphere-by-sphere: at twenty-five units her
    // head was a thumbnail on a barrel and the face — the part rule 3 leans on
    // — did not survive the distance.
    <group position={[0, 2.06, 0.36]} scale={1.2}>
      <mesh scale={[0.9, 1, 1.15]}>
        <sphereGeometry args={[0.27, 14, 12]} />
        <meshToonMaterial color={data.body} />
      </mesh>
      {/* Long muzzle — the single most horse-like thing about her. */}
      <mesh position={[0, -0.12, 0.28]} rotation={[0.35, 0, 0]} scale={[0.78, 0.78, 1]}>
        <capsuleGeometry args={[0.15, 0.22, 4, 10]} />
        <meshToonMaterial color={data.body} />
      </mesh>
      <mesh position={[0, -0.24, 0.42]} scale={[0.8, 0.6, 0.7]}>
        <sphereGeometry args={[0.14, 10, 8]} />
        <meshToonMaterial color={data.belly} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.05, -0.24, 0.5]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshBasicMaterial color={INK} />
        </mesh>
      ))}

      {/* The horn. Spiralled by stacking cones of falling radius, and drawn
          thick: it is the one shape that says unicorn rather than pony, and a
          fine gold spike against the pink net said nothing at all. */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`h${i}`} position={[0, 0.31 + i * 0.12, 0.06]} rotation={[-0.25, 0, 0]}>
          <coneGeometry args={[0.095 - i * 0.02, 0.16, 7]} />
          <meshToonMaterial color={data.accent} />
        </mesh>
      ))}

      <group ref={rig.limbL} position={[-0.16, 0.22, -0.04]}>
        <Ear data={data} side={-1} />
      </group>
      <group ref={rig.limbR} position={[0.16, 0.22, -0.04]}>
        <Ear data={data} side={1} />
      </group>

      <KeeperFace ink={INK} eyeSpacing={0.15} eyeSize={0.1} y={0.05} z={0.19} />
      <KeeperSmile ink={INK} width={0.06} y={-0.3} z={0.47} />
    </group>
  )
}

function Ear({ data, side }: { data: KeeperData; side: number }) {
  return (
    <mesh rotation={[0, 0, side * 0.25]}>
      <coneGeometry args={[0.06, 0.2, 7]} />
      <meshToonMaterial color={data.bodyDark} />
    </mesh>
  )
}

function Tail({ data }: { data: KeeperData }) {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, -i * 0.16, -0.08 - i * 0.05]} rotation={[0.3, 0, 0]} scale={[1.5, 1, 0.6]}>
          <sphereGeometry args={[0.17 - i * 0.02, 8, 8]} />
          <meshToonMaterial color={data.trim} />
        </mesh>
      ))}
    </>
  )
}
