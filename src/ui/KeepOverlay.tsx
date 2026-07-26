import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { PITCH } from '../game/constants'

/**
 * The keeper-mode control: put your finger where you want her, and she runs
 * there. No gesture vocabulary to learn, no timing — the whole skill is looking
 * at the target ring and moving.
 *
 * The screen-to-pitch mapping is deliberately aligned with what the camera
 * shows, so the princess ends up *under the finger* rather than at some scaled
 * offset from it.
 */

export function KeepOverlay({
  onAim,
  hint,
  halfWidth = PITCH.goalHalfWidth + 1.0,
}: {
  onAim: (x: number) => void
  hint: string
  /**
   * World half-width the full screen maps onto. It defaults to what the camera
   * shows at the goal line; the runner passes its own narrower lane so the
   * character still ends up under the finger.
   */
  halfWidth?: number
}) {
  const dragging = useRef(false)
  const [touched, setTouched] = useState(false)

  function aimFrom(clientX: number) {
    const fraction = clientX / Math.max(1, window.innerWidth)
    onAim((fraction - 0.5) * 2 * halfWidth)
  }

  function down(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    setTouched(true)
    aimFrom(e.clientX)
  }

  function move(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current) return
    aimFrom(e.clientX)
  }

  function up() {
    dragging.current = false
  }

  return (
    <div
      className="absolute inset-0 touch-none"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {!touched && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <p className="animate-wobble rounded-full bg-black/35 px-4 py-2 text-base font-bold text-white backdrop-blur-sm">
            👆 {hint}
          </p>
        </div>
      )}
    </div>
  )
}
