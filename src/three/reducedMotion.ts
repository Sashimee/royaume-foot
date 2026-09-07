import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Whether the player has asked their system for less movement.
 *
 * `src/index.css` already honours this for the DOM animations, but the whole 3D
 * half of the game ignored it: the idle breathing, the wing beats, the mascot's
 * hop and the crowd all kept moving. Those are decorative, they never stop, and
 * continuous background motion is exactly what the setting exists to quiet.
 *
 * **Gameplay motion is not reduced.** A ball that does not fly is not a gentler
 * football game, it is a broken one. What this switches off is the movement that
 * is there for charm rather than for play.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(QUERY).matches
      : false,
  )

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(QUERY)
    const update = () => setReduced(mq.matches)
    update()
    // Safari below 14 has no addEventListener on MediaQueryList, and this game
    // is aimed at whatever tablet is in the house.
    if (mq.addEventListener) {
      mq.addEventListener('change', update)
      return () => mq.removeEventListener('change', update)
    }
    mq.addListener(update)
    return () => mq.removeListener(update)
  }, [])

  return reduced
}
