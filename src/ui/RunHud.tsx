import { useEffect, useRef } from 'react'

/**
 * The runner's time bar.
 *
 * It reads the clock from the running simulation instead of holding it in React
 * state, and writes the width straight onto the element — a bar driven by state
 * would re-render the whole screen, and the 3D scene with it, sixty times a
 * second.
 */
export function RunHud({ progress }: { progress: () => number }) {
  const fill = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (fill.current) fill.current.style.width = `${(1 - progress()) * 100}%`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progress])

  return (
    // The bar alone read as decoration; the hourglass is what says "this is
    // running out". Rule 2 applies to what the game tells you, not just to what
    // you press.
    <div className="flex items-center gap-2" role="img" aria-label="time">
      <span className="text-xl">⏳</span>
      <div
        data-testid="run-timer"
        className="h-6 w-36 overflow-hidden rounded-full bg-black/30 backdrop-blur-sm"
      >
        <div ref={fill} className="h-full w-full rounded-full bg-gradient-to-r from-yellow-300 to-pink-400" />
      </div>
    </div>
  )
}
