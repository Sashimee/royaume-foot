import { CUP_LEGS } from '../game/cup'
import { useT } from '../i18n/useLang'

const BADGES: Record<string, string> = { shoot: '🥅', keep: '🧤', run: '⭐', tower: '🧱' }

/**
 * Where you are in the Coupe du Royaume.
 *
 * Four dots along the bottom, the current one lit. A child mid-cup needs to
 * know two things — that this round is part of something longer, and how much
 * of it is left — and both are questions a row of dots answers without a
 * single word.
 */
export function CupBanner({ leg }: { leg: number }) {
  const t = useT()

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4">
      <div className="flex items-center gap-3 rounded-full bg-black/35 px-5 py-2 backdrop-blur-sm">
        <span className="text-lg font-black text-yellow-200">
          🏆 {t('cup.leg')} {leg + 1}/{CUP_LEGS.length}
        </span>
        <div className="flex gap-1.5">
          {CUP_LEGS.map((mode, i) => (
            <span
              key={mode}
              className={`text-xl ${i === leg ? '' : i < leg ? 'opacity-45 grayscale' : 'opacity-30'}`}
            >
              {BADGES[mode]}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
