import type { ReactNode } from 'react'
import { sfx } from '../audio/sfx'

/**
 * UI primitives.
 *
 * Two rules run through all of them, both from the 6–7 age target:
 *  - **nothing smaller than 64px.** Small fingers, imprecise aim.
 *  - **never text alone.** Every control carries an emoji or shape that means
 *    the same thing, so a child who cannot read yet can still play.
 */

export function BigButton({
  children,
  onClick,
  tone = 'primary',
  label,
  compact = false,
}: {
  children: ReactNode
  onClick: () => void
  tone?: 'primary' | 'secondary'
  /** Screen-reader label, when the visible content is mostly emoji. */
  label?: string
  /**
   * Smaller type and tighter padding, for buttons sharing a row. Still 64px
   * tall — the tap target does not shrink, only the text inside it. Six
   * languages means some labels are three words long, and at full size they
   * wrapped to three lines and pushed the rest of the menu off the screen.
   */
  compact?: boolean
}) {
  const palette =
    tone === 'primary'
      ? 'bg-gradient-to-b from-pink-500 to-fuchsia-700 border-pink-200'
      : 'bg-gradient-to-b from-violet-500/95 to-violet-800/95 border-violet-200'

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        sfx.tap()
        onClick()
      }}
      className={`${palette} ${compact ? 'px-3 py-2 text-xl leading-tight' : 'px-5 py-3 text-2xl'}
        min-h-16 text-balance rounded-3xl border-4 font-bold text-white
        shadow-[0_8px_0_rgba(0,0,0,0.22)] transition active:translate-y-1
        active:shadow-[0_3px_0_rgba(0,0,0,0.22)]`}
    >
      {children}
    </button>
  )
}

export function IconButton({
  children,
  onClick,
  label,
}: {
  children: ReactNode
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        sfx.tap()
        onClick()
      }}
      className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/40
        bg-white/15 text-3xl backdrop-blur-sm transition active:scale-95"
    >
      {children}
    </button>
  )
}

/** Star counter. `max` fills the row with empty slots for the result screen. */
export function StarRow({ count, max, size = 'md' }: { count: number; max?: number; size?: 'md' | 'lg' }) {
  const slots = max ?? count
  const cls = size === 'lg' ? 'text-6xl' : 'text-2xl'
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`${count} / ${slots}`}>
      {Array.from({ length: slots }, (_, i) => (
        <span
          key={i}
          className={`${cls} ${i < count ? 'animate-pop-in' : 'opacity-25 grayscale'}`}
          style={{ animationDelay: `${i * 0.18}s` }}
        >
          ⭐
        </span>
      ))}
    </div>
  )
}

/** A wardrobe card: big, tappable, and obviously locked or not. */
export function PickCard({
  badge,
  name,
  selected,
  locked,
  lockedLabel,
  onClick,
}: {
  badge: string
  name?: string
  selected: boolean
  locked: boolean
  lockedLabel?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={locked ? `${name ?? badge} — ${lockedLabel ?? ''}` : name ?? badge}
      aria-pressed={selected}
      onClick={() => {
        // A locked card is pressable but not selectable. It used to be
        // `disabled`, so a tap produced no sound, no press and no movement —
        // and a six-year-old taps everything. Silence there reads as broken,
        // or as being told off, which is the shape rule 3 exists to forbid.
        if (locked) {
          sfx.nudge()
          return
        }
        sfx.tap()
        onClick()
      }}
      className={`relative flex h-24 w-24 flex-col items-center justify-center rounded-3xl border-4
        transition active:scale-95
        ${selected ? 'border-yellow-300 bg-white/25' : 'border-white/25 bg-white/10'}`}
    >
      {/* Only the emblem dims when locked. Fading the whole card took the price
          with it, and an unreadable price is the same as no price.

          The emblem stays its own badge, dimmed, with the padlock in the
          corner. Replacing it outright meant three of the four tiles on most
          tabs were the *same* padlock, and a child cannot want a padlock —
          there was nothing on those tabs to play towards. */}
      <span className="relative text-4xl">
        <span className={locked ? 'opacity-40' : ''}>{badge}</span>
        {locked && <span className="absolute -right-2 -top-1 text-base">🔒</span>}
      </span>
      {/* An OPAQUE plate, not a translucent one. The wardrobe's backdrop runs
          from deep violet at the top to pale pink at the bottom, so a
          `bg-black/55` chip that read at 7:1 next to the princesses fell to
          1.05:1 by the time it reached the last knight. A label's legibility
          must not depend on how far down the page it happens to sit. */}
      {(locked || name) && (
        <span
          className={`mt-1 rounded-full bg-[#241539] px-2 py-0.5 text-sm font-black leading-none
            ${locked ? 'text-yellow-200' : 'text-white'}`}
        >
          {locked ? lockedLabel : name}
        </span>
      )}
    </button>
  )
}

export function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[2rem] border-4 border-white/25 bg-black/35 p-5 backdrop-blur-md">
      {children}
    </div>
  )
}
