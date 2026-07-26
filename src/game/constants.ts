/**
 * Every distance here is a *pitch design unit* (roughly a metre), independent of
 * screen size — the camera scales the world for display, exactly like the board
 * units in the collage app. Tuning the game means editing this file, not the
 * components.
 */

export const PITCH = {
  /** The goal line. The ball travels towards -z. */
  goalZ: -14,
  /** Half of the goal mouth. Deliberately generous: a 6-year-old must score. */
  goalHalfWidth: 4.2,
  goalHeight: 3.2,
  /** Post thickness, used for the "clonk" outcome and for rendering. */
  postRadius: 0.16,
  ballRadius: 0.34,
  ballStart: { x: 0, y: 0.34, z: 1.6 },
  groundY: 0,
  /** Where the crowd stands, for the stadium ring. */
  pitchHalfWidth: 11,
} as const

export const PHYSICS = {
  /** Lighter than real gravity: shots hang in the air and read as graceful. */
  gravity: -11,
  /** Air drag per second. Keeps long shots from flying forever. */
  drag: 0.12,
  /** Energy kept after a ground bounce. */
  restitution: 0.55,
  /** Horizontal slow-down applied once per bounce. */
  bounceFriction: 0.72,
  /** Rolling resistance, per second, while the ball sits on the grass. */
  rollFriction: 0.9,
  /** Impact speed below which the ball rolls instead of bouncing. */
  restThreshold: 0.8,
  /** Simulation is sub-stepped to this size so a fast ball never tunnels. */
  maxStep: 1 / 120,
} as const

export const SHOT = {
  /** Speed at the weakest possible flick — still reaches the goal. */
  minSpeed: 15,
  /** Speed at a full-length flick. */
  maxSpeed: 23,
  /**
   * Widest sideways angle a flick can produce, in radians (~20.6°).
   *
   * The goal mouth seen from the penalty spot only subtends ~15°, so a full
   * sideways flick aims a little *past* the post and lands inside ASSIST's
   * rescue band — meaning the ball is never lost sideways, and the only thing
   * standing between the child and a goal is the keeper. A wider angle here was
   * the single biggest difficulty bug: at 0.55 rad two thirds of all flicks
   * flew outside the posts.
   */
  maxAngle: 0.3,
  /**
   * Sideways drag, as a fraction of viewport width, that produces the full
   * angle. Aim and power are read from separate axes — horizontal drag steers,
   * vertical drag powers — because coupling them (via the swipe angle) means a
   * hard shot is also an inaccurate one, which is exactly backwards for a
   * 6-year-old.
   */
  lateralFullFraction: 0.2,
  /**
   * Upward speed range. Tuned against PHYSICS.gravity so that even a full-power
   * shot arrives *under* the 3.2 crossbar — a child who swipes as hard as they
   * can should not be punished with a ball over the roof.
   */
  minLift: 3.2,
  maxLift: 6.5,
  /** An upward flick shorter than this fraction of the screen is just a tap. */
  minDragFraction: 0.05,
  /** Upward drag (fraction of screen height) that means "full power". */
  fullPowerFraction: 0.4,
} as const

export const ASSIST = {
  /**
   * Near-miss magnetism. A shot predicted to cross the goal line within this
   * many units *outside* a post is bent back in. This is the single most
   * important kindness in the game: it turns "so close!" into "GOAL!" without
   * the child ever noticing a nudge.
   */
  outerBand: 1.6,
  /** Where an assisted shot is aimed, as a fraction of the goal half-width. */
  targetFraction: 0.78,
  /** Shots already this far inside the goal are left completely alone. */
  innerGuard: 0.9,
} as const

export const KEEPER = {
  startX: 0,
  /** Sideways travel of the patrol, in units from the centre. */
  patrolRange: 2.4,
  /** Slow enough that a child can watch it, learn it, and beat it. */
  patrolSpeed: 1.5,
  /** How far the keeper can reach sideways when the ball crosses the line. */
  reach: 1.15,
  /** Anything above this height sails over the keeper. */
  reachHeight: 2.0,
  /** Length of the dive animation, seconds. */
  diveDuration: 0.45,
} as const

export const ROUND = {
  shotsPerRound: 5,
  /** Stars are never zero — see starsFor(). */
  starsForPerfect: 3,
} as const

/** How long the ball is allowed to be in flight before the shot is called. */
export const SHOT_TIMEOUT = 4.5

/**
 * The camera, shared by both mini-games.
 *
 * These live here rather than in Scene.tsx so that gameplay code can *reason
 * about what is on screen*. Anything placed nearer than the goal has far less
 * room than the goal's own width suggests — see visibleHalfWidthAt().
 */
export const CAMERA = {
  z: 11,
  y: 4.2,
  /** Extra half-width kept visible beyond the posts at the goal line. */
  fitMargin: 1.0,
} as const

/**
 * Half of the world width the camera shows at a given z, in pitch units.
 *
 * The frustum is set to fit the goal across the screen at the goal line, so
 * everything closer to the camera gets proportionally less room. The shooter in
 * keeper mode stands well in front of the goal, and putting him at the goal's
 * own half-width would push him off the side of the screen.
 */
export function visibleHalfWidthAt(z: number): number {
  const atGoal = PITCH.goalHalfWidth + CAMERA.fitMargin
  const goalDistance = CAMERA.z - PITCH.goalZ
  return (atGoal / goalDistance) * (CAMERA.z - z)
}

/**
 * "Gardienne du château" — the child plays *in* goal and a friendly dragon
 * shoots at them.
 *
 * The control is direct positional drag: the princess follows the finger along
 * the goal line. For this age that beats swipe-to-dive, which asks a child to
 * translate a gesture into an intention. Here there is nothing to translate —
 * put her where the ball is going.
 */
export const KEEP = {
  /** How far she can stretch either side of where she stands. */
  reach: 1.25,
  /** She can reach anything below this; nothing is aimed above it. */
  reachHeight: 2.6,
  /** Units per second she slides. Fast enough to always be *able* to get there. */
  maxSpeed: 7.5,
  /**
   * Telegraph. The target ring appears this long before the kick, which is the
   * single thing that makes the mode fair for a six-year-old — reacting to a
   * ball already in flight is a reflex test, and this is not that.
   */
  windUp: 1.0,
  /** Ball travel time from the shooter to the goal line. */
  flightTime: 0.85,
  /** Shots never aim beyond this fraction of the goal half-width. */
  aimSpread: 0.78,
  /** Lowest and highest a shot is ever aimed. */
  aimMinY: 0.5,
  aimMaxY: 2.1,
  /**
   * Where the dragon strikes from.
   *
   * Composition, not realism, sets this. Near the camera the visible pitch is
   * only ~±1.9 units wide, so a shooter down there is either off-screen or
   * enormous; at mid-pitch he plants himself squarely in front of the goal. Far
   * out and off to one side (see `shooterMinX`) he stays small and clear of the
   * goal mouth the child needs to watch.
   */
  shooterZ: -8,
  /**
   * The shooter always stands at least this far off centre, on one side. The
   * spread is capped so his whole body stays on screen — see the test that
   * checks it against visibleHalfWidthAt(shooterZ).
   */
  shooterMinX: 2.5,
  shooterSideSpread: 0.7,
  /** Roughly half the dragon's width, for that on-screen check. */
  shooterHalfWidth: 0.7,
  /** How long the result is held on screen before the next shot. */
  settle: 1.6,
} as const

/**
 * "Course aux étoiles" — the runner mini-game.
 *
 * The runner stays near the camera and the world comes to them, which keeps the
 * character large and readable the whole time instead of shrinking into the
 * distance.
 */
export const RUN = {
  /** Length of one run, seconds. Short enough to hold a six-year-old. */
  duration: 24,
  /** How fast the world flows past. */
  speed: 9,
  /**
   * Where the runner stands. Pushed away from the camera so the lane has room:
   * the frustum is fitted to the goal at the goal line, so close to the camera
   * there is far less width than the pitch suggests.
   */
  playerZ: -3,
  /** Where stars appear, and where they are finally dropped. */
  spawnZ: -30,
  despawnZ: 5,
  firstSpawn: 0.8,
  spawnEvery: 0.55,
  /** Every Nth star is golden. */
  bigEvery: 7,
  /**
   * How far off centre the runner and the stars can go.
   *
   * This must stay inside visibleHalfWidthAt(playerZ) — at 3.2 the runner
   * literally ran off the side of the screen, which the child experiences as
   * the game losing them. A test checks it.
   */
  laneHalfWidth: 2.2,
  /** Sideways and lengthwise catch tolerance. Generous on purpose. */
  pickupRadius: 1.0,
  pickupDepth: 1.1,
  /** Runner's top sideways speed. */
  playerSpeed: 7.5,
  twoStarScore: 16,
  threeStarScore: 28,
} as const
