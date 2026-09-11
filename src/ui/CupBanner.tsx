import { CUP_LEGS } from '../game/cup'
import { useT } from '../i18n/useLang'
import { MODE_BADGES } from './mapPlaces'

/**
 * Where you are in the Coupe du Royaume.
 *
 * Four badges in the order the road on the map visits them, the current one
 * lit. A child mid-cup needs to know two things — that this round is part of
 * something longer, and how much of it is left — and both are questions a row
 * of badges answers without a single word.
 *
 * It rides in the HUD stack rather than floating over the pitch. At the foot of
 * the screen it covered the "how do I play this one" chip; moved up a notch, it
 * covered *the ball*. The ball sits at a fixed point on the pitch while this
 * plate was pinned a fixed number of pixels off the bottom, so the two drifted
 * into each other as the screen grew — clear on a 390-wide phone, straight
 * across the ball on a 768-wide tablet. Stacked in the HUD it cannot collide
 * with anything on the pitch at any size.
 */
export function CupBanner({ leg }: { leg: number }) {
  const t = useT()

  return (
    <div
      className="flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 backdrop-blur-sm"
      role="img"
      aria-label={`${t('cup.leg')} ${leg + 1}/${CUP_LEGS.length}`}
    >
      <span className="text-lg font-black text-yellow-200">
        🏆 {leg + 1}/{CUP_LEGS.length}
      </span>
      <div className="flex gap-1">
        {CUP_LEGS.map((mode, i) => (
          <span
            key={mode}
            className={`text-lg ${i === leg ? '' : i < leg ? 'opacity-45 grayscale' : 'opacity-30'}`}
          >
            {MODE_BADGES[mode]}
          </span>
        ))}
      </div>
    </div>
  )
}
