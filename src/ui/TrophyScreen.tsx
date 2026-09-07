import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { useGame } from '../store/gameStore'
import { useSave } from '../store/saveStore'
import { CUP_LEGS, cupTotals, trophyGrade } from '../game/cup'
import { useT } from '../i18n/useLang'
import { sfx } from '../audio/sfx'
import { BigButton, Panel } from './ui'

const BADGES: Record<string, string> = { shoot: '🥅', keep: '🧤', run: '⭐', tower: '🧱' }

/**
 * The end of the Coupe du Royaume, and the end of the game as a whole — the
 * one screen a child reaches by finishing everything rather than by doing well.
 *
 * It never grades the performance downwards. The trophy count varies, the
 * wording does not: getting here is the achievement, and the screen says so
 * whatever the legs scored.
 */
export function TrophyScreen() {
  const t = useT()
  const cupStars = useGame((s) => s.cupStars)
  const claimCupBonus = useGame((s) => s.claimCupBonus)
  const startCup = useGame((s) => s.startCup)
  const goHome = useGame((s) => s.goHome)
  const addStars = useSave((s) => s.addStars)
  const stars = useSave((s) => s.stars)

  const totals = cupTotals(cupStars)
  const trophies = trophyGrade(cupStars)

  // The bonus is banked once, on arrival. A ref rather than state: re-running
  // this would quietly pay a child twice for one cup.
  const claimed = useRef(false)
  useEffect(() => {
    if (claimed.current) return
    claimed.current = true
    const bonus = claimCupBonus()
    if (bonus > 0) addStars(bonus)
    sfx.crown()
    confetti({
      particleCount: 320,
      spread: 170,
      startVelocity: 60,
      origin: { y: 0.55 },
      colors: ['#ffd84d', '#ff8ec7', '#8be0d0', '#c58cff', '#ffffff'],
      disableForReducedMotion: true,
    })
  }, [claimCupBonus, addStars])

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm">
      <div className="animate-pop-in w-full max-w-sm">
        <Panel>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex gap-1" role="img" aria-label={t('trophy.title')}>
              {Array.from({ length: trophies }, (_, i) => (
                <span key={i} className="animate-wobble text-6xl">
                  🏆
                </span>
              ))}
            </div>

            <h2 className="text-balance text-3xl font-black text-yellow-200">{t('trophy.title')}</h2>

            {/* Every leg, with what it earned. The child can see their own run
                back — which of the four went well is the interesting part. */}
            <div className="flex flex-col gap-1.5 self-stretch">
              {CUP_LEGS.map((mode, i) => (
                <div key={mode} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-2">
                  <span className="text-2xl">{BADGES[mode]}</span>
                  <span className="text-xl font-black text-white">
                    {'⭐'.repeat(cupStars[i] ?? 0)}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xl font-bold text-white/90">
              🏆 {t('trophy.bonus')} ⭐ {totals.finish + totals.perfect}
            </p>
            {totals.perfect > 0 && (
              <p className="text-lg font-black text-yellow-200">✨ {t('trophy.perfect')}</p>
            )}

            <p className="text-lg font-semibold text-yellow-200">
              ⭐ {stars} {t('stars.total')}
            </p>

            <div className="mt-1 flex flex-col gap-3 self-stretch">
              <BigButton onClick={startCup}>🏆 {t('trophy.again')}</BigButton>
              <BigButton tone="secondary" onClick={goHome}>
                🏠 {t('wardrobe.back')}
              </BigButton>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
