import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * A scrollable panel that *looks* scrollable.
 *
 * A playtest showed the problem plainly: a child did not realise the list
 * continued below the fold, so the items down there may as well not have
 * existed. A flat cut-off edge reads as the end of the content. This fades the
 * bottom edge and floats a nudge arrow whenever there is more, and drops both
 * the moment you reach the end.
 */
export function ScrollArea({ children, className = '' }: { children: ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const check = () => {
      // A few pixels of slack: sub-pixel layout means scrollTop rarely lands
      // exactly on the bottom.
      setMore(el.scrollHeight - el.clientHeight - el.scrollTop > 8)
    }
    check()
    el.addEventListener('scroll', check, { passive: true })
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', check)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={box} className={`h-full overflow-y-auto pb-4 ${className}`} style={{ touchAction: 'pan-y' }}>
        {children}
      </div>

      {more && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
          <div
            data-testid="scroll-more"
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center"
          >
            <span className="animate-wobble rounded-full bg-white/25 px-3 py-1 text-2xl backdrop-blur-sm">⬇️</span>
          </div>
        </>
      )}
    </div>
  )
}
