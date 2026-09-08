import { TOWER } from './constants'
import type { Vec3 } from './physics'

/**
 * "Casse-tour" — stacks of blocks, and a ball.
 *
 * Pure, like every other rule module here: it takes a state and returns a new
 * one, so a whole round can be played out in a test with no canvas anywhere
 * near it. The scene reads `blocks` and moves meshes; it never decides anything.
 *
 * A block is either standing or falling. There is no third state and no
 * resting-on-each-other simulation — a real stack solver would be a week of
 * work to produce something a six-year-old cannot tell apart from *the ones
 * above it fall too*, which is one line.
 */

export interface Block {
  id: number
  /** Which tower it belongs to, and how high up it started. */
  column: number
  row: number
  x: number
  y: number
  z: number
  /** Null while standing; a velocity once knocked. */
  v: Vec3 | null
  /** Spin picked up on the way down, radians/s. */
  spin: number
  /**
   * How far it has tumbled, in radians.
   *
   * Held here rather than accumulated onto the mesh, so the scene stays a pure
   * read of this state. It was a `mesh.rotation.z +=` in the frame loop, and
   * nothing reset it when the towers were rebuilt — so the second set of towers
   * was stacked out of the tilted blocks left over from the first.
   */
  angle: number
  /** True once it has come to rest on the ground. */
  landed: boolean
}

export interface TowerState {
  blocks: Block[]
  /** Blocks knocked over so far this round, across every shot. */
  knocked: number
  /** Ids toppled on the last step, for the effects layer to react to. */
  justKnocked: number[]
}

export function makeTowers(): TowerState {
  const blocks: Block[] = []
  let id = 1
  const first = -((TOWER.columns - 1) / 2) * TOWER.spacing

  for (let column = 0; column < TOWER.columns; column += 1) {
    for (let row = 0; row < TOWER.height; row += 1) {
      blocks.push({
        id,
        column,
        row,
        x: first + column * TOWER.spacing,
        // Blocks sit *on* the ground, so the lowest one's centre is half a
        // block up rather than at zero.
        y: TOWER.blockSize / 2 + row * TOWER.blockSize,
        z: TOWER.z,
        v: null,
        spin: 0,
        angle: 0,
        landed: false,
      })
      id += 1
    }
  }

  return { blocks, knocked: 0, justKnocked: [] }
}

/** Where a block started, which is where it must return to on a rebuild. */
export function restingY(row: number): number {
  return TOWER.blockSize / 2 + row * TOWER.blockSize
}

export function standingCount(s: TowerState): number {
  return s.blocks.filter((b) => b.v === null).length
}

/** True once nothing is left to knock over — the round can end early. */
export function towersCleared(s: TowerState): boolean {
  return standingCount(s) === 0
}

/**
 * Advances every falling block by `dt`. Standing blocks are untouched, so this
 * is safe to call every frame whether or not a shot is in the air.
 */
export function stepTowers(state: TowerState, dt: number): TowerState {
  const blocks = state.blocks.map((b) => {
    if (b.v === null || b.landed) return b
    const v = { x: b.v.x, y: b.v.y + TOWER.gravity * dt, z: b.v.z }
    const y = b.y + v.y * dt
    const angle = b.angle + b.spin * dt
    if (y <= TOWER.floorY) {
      return { ...b, x: b.x + v.x * dt, y: TOWER.floorY, z: b.z + v.z * dt, v, angle, landed: true }
    }
    return { ...b, x: b.x + v.x * dt, y, z: b.z + v.z * dt, v, angle }
  })
  return { ...state, blocks, justKnocked: [] }
}

/**
 * Knocks over anything the ball has reached, and everything stacked above it.
 *
 * The cascade is the whole feel of the mini-game: hitting the bottom of a tower
 * has to bring the entire thing down, because that is what a child expects from
 * every stack of blocks they have ever pushed over.
 */
export function collideTowers(state: TowerState, ball: Vec3, ballRadius: number): TowerState {
  const reach = TOWER.blockSize / 2 + ballRadius + TOWER.hitPadding
  const inLine = state.blocks.filter(
    (b) =>
      b.v === null &&
      Math.abs(ball.x - b.x) <= reach &&
      Math.abs(ball.z - b.z) <= reach &&
      Math.abs(ball.y - b.y) <= reach,
  )

  // Per column, the ball strikes the block it is *level with*, not every block
  // it overlaps. The ball is nearly as wide as a block, so a strict overlap
  // test always catches the one below as well — and then a shot aimed at the
  // top of a tower would fell the whole thing, making the child's aim
  // meaningless. Nearest-in-height is also what they see happen.
  const hitRow = new Map<number, { row: number; gap: number }>()
  for (const b of inLine) {
    const gap = Math.abs(ball.y - b.y)
    const best = hitRow.get(b.column)
    if (best === undefined || gap < best.gap) hitRow.set(b.column, { row: b.row, gap })
  }

  if (hitRow.size === 0) {
    // Still clear last step's list: `justKnocked` describes *this* call, and a
    // stale one would have the effects layer replaying a topple every frame.
    return state.justKnocked.length === 0 ? state : { ...state, justKnocked: [] }
  }

  const lowestByColumn = new Map<number, number>()
  for (const [column, best] of hitRow) lowestByColumn.set(column, best.row)

  const justKnocked: number[] = []
  const blocks = state.blocks.map((b) => {
    if (b.v !== null) return b
    const from = lowestByColumn.get(b.column)
    if (from === undefined || b.row < from) return b

    justKnocked.push(b.id)
    // Away from the ball and outwards, faster the higher it stood — a toppling
    // stack should spray, not slide down its own footprint.
    const away = Math.sign(b.x - ball.x) || 1
    const lift = 0.6 + b.row * 0.35
    return {
      ...b,
      v: {
        x: away * TOWER.scatter * (0.4 + b.row * 0.22),
        y: lift,
        z: -TOWER.scatter * 0.45,
      },
      spin: (away || 1) * (2 + b.row * 1.4),
    }
  })

  return { blocks, knocked: state.knocked + justKnocked.length, justKnocked }
}

/**
 * Stars for a finished round. **Never zero**, like every other mode: a child
 * who knocks over one block has still knocked over a block.
 */
export function starsForTowers(knocked: number): number {
  if (knocked >= TOWER.threeStarBlocks) return 3
  if (knocked >= TOWER.twoStarBlocks) return 2
  return 1
}
