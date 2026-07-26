import { useState } from 'react'
import { sfx } from '../audio/sfx'
import { useSave } from '../store/saveStore'
import { useT } from '../i18n/useLang'

/**
 * Start again from zero.
 *
 * Rediscovering the unlocks is a large part of the fun at this age, so wiping
 * progress is a feature rather than an accident waiting to happen — but it is
 * still destructive, and a six-year-old presses everything. So it is two taps,
 * the confirm step says plainly what disappears, and the safe choice is the one
 * that looks like every other button in the game.
 */
export function ResetStars() {
  const t = useT()
  const stars = useSave((s) => s.stars)
  const reset = useSave((s) => s.reset)
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <div className="mb-8 mt-2 flex justify-center">
        <button
          type="button"
          onClick={() => {
            sfx.tap()
            setConfirming(true)
          }}
          className="min-h-12 rounded-2xl border-2 border-white/25 bg-white/10 px-5 py-3 text-base font-bold text-white/80"
        >
          🔄 {t('reset.button')}
        </button>
      </div>
    )
  }

  // A modal, not an inline panel. Inline, the confirm buttons ended up below
  // the fold and clipped by the play bar — a destructive choice a child can
  // only half see is worse than no confirmation at all.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="animate-pop-in w-full max-w-sm rounded-[2rem] border-4 border-white/25 bg-[#3b1e6b] p-6 text-center">
        <p className="mb-2 text-2xl font-black text-white">{t('reset.confirm')}</p>
        <p className="mb-6 text-xl font-bold text-yellow-200">
          ⭐ {stars} → ⭐ 0
        </p>
        <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            sfx.tap()
            setConfirming(false)
          }}
          className="min-h-16 rounded-2xl border-4 border-emerald-200 bg-gradient-to-b from-emerald-400 to-emerald-600
            px-5 py-4 text-xl font-bold text-white shadow-[0_6px_0_rgba(0,0,0,0.22)]"
        >
          ↩️ {t('reset.keep')}
        </button>
        <button
          type="button"
          onClick={() => {
            reset()
            sfx.whistle()
            setConfirming(false)
          }}
          className="min-h-16 rounded-2xl border-2 border-white/30 bg-white/10 px-5 py-4 text-lg font-bold text-white/80"
        >
          🔄 {t('reset.doIt')}
        </button>
        </div>
      </div>
    </div>
  )
}
