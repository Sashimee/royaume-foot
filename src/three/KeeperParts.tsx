/**
 * The face every keeper wears.
 *
 * Kept in one place on purpose: these eyes are the reason the keeper reads as a
 * friend rather than an obstacle, and rule 3 of the project ("no fail state")
 * leans on them. A species that drew its own would eventually draw a meaner
 * one.
 */
export function KeeperFace({
  ink,
  eyeSpacing = 0.16,
  eyeSize = 0.115,
  y = 0.1,
  z = 0.22,
}: {
  /** Pupil and mouth colour — dark enough to read against the head. */
  ink: string
  eyeSpacing?: number
  eyeSize?: number
  y?: number
  z?: number
}) {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * eyeSpacing, y, z]}>
          <mesh>
            <sphereGeometry args={[eyeSize, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[side * 0.01, 0, eyeSize * 0.7]}>
            <sphereGeometry args={[eyeSize * 0.52, 10, 10]} />
            <meshBasicMaterial color={ink} />
          </mesh>
          {/* The highlight. Without it the pupil is a hole, and a hole is not friendly. */}
          <mesh position={[side * 0.03, eyeSize * 0.35, eyeSize]}>
            <sphereGeometry args={[eyeSize * 0.19, 6, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </>
  )
}

/** An upturned mouth. A half-torus, so it curves the right way at any size. */
export function KeeperSmile({ ink, width = 0.09, y = -0.14, z = 0.36 }: { ink: string; width?: number; y?: number; z?: number }) {
  return (
    <mesh position={[0, y, z]}>
      <torusGeometry args={[width, width * 0.2, 6, 12, Math.PI]} />
      <meshBasicMaterial color={ink} />
    </mesh>
  )
}
