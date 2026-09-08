import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { ROUND } from '../game/constants'
import { useGame } from '../store/gameStore'
import { sfx } from '../audio/sfx'
import { useSave } from '../store/saveStore'
import { nextUnlock, unlockedBetween } from '../data/roster'
import { useT } from '../i18n/useLang'
import { BigButton, Panel, StarRow } from './ui'

/**
 * The end of a round. It is written to be a celebration in every case — there
 * is no "you lost" state, only how much sparkle you got.
 */
export function ResultScreen() {
  const t = useT()
  const goals = useGame((s) => s.goals)
  const mode = useGame((s) => s.mode)
  const earnedStars = useGame((s) => s.earnedStars)
  const startRound = useGame((s) => s.startRound)
  const goWardrobe = useGame((s) => s.goWardrobe)
  const stars = useSave((s) => s.stars)

  // `addStars` has already run by the time this screen mounts, so the count the
  // round began from is simply what is left when the earned stars come back off.
  const justUnlocked = unlockedBetween(stars - earnedStars, stars)
  const upcoming = nextUnlock(stars)

  useEffect(() => {
    if (justUnlocked.length === 0) return
    // Crossing a threshold is the biggest thing that can happen in a round, so
    // it gets its own burst regardless of how the round itself went.
    confetti({
      particleCount: 140,
      spread: 110,
      startVelocity: 45,
      origin: { y: 0.45 },
      colors: ['#ffd84d', '#ff8ec7', '#8be0d0', '#ffffff'],
      disableForReducedMotion: true,
    })
    sfx.crown()
  }, [justUnlocked.length])

  useEffect(() => {
    if (earnedStars < ROUND.starsForPerfect) return
    // A perfect round deserves more than the per-goal confetti.
    confetti({
      particleCount: 200,
      spread: 150,
      startVelocity: 55,
      origin: { y: 0.5 },
      colors: ['#ff8ec7', '#ffd84d', '#8be0d0', '#c58cff', '#ffffff'],
      disableForReducedMotion: true,
    })
  }, [earnedStars])

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/45 p-6 backdrop-blur-sm">
      <div className="animate-pop-in w-full max-w-sm">
        <Panel>
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-4xl font-black text-white">{t('result.title')}</h2>

            <StarRow count={earnedStars} max={ROUND.starsForPerfect} size="lg" />

            <p className="text-2xl font-bold text-white/90">
              {/* The runner has no denominator — there is no fixed number of
                  stars to catch, so showing "12 / 5" would be nonsense. */}
              {mode === 'run' ? (
                <>
                  ⭐ {goals} {t('result.stars')}
                </>
              ) : mode === 'tower' ? (
                /* Blocks have no denominator either: the towers are rebuilt
                   when they are all down, so there is no fixed number to hit. */
                <>
                  🧱 {goals} {t('result.blocks')}
                </>
              ) : (
                <>
                  {mode === 'shoot' ? '🥅' : '🧤'} {goals} / {ROUND.shotsPerRound}{' '}
                  {mode === 'shoot' ? t('result.goals') : t('result.saves')}
                </>
              )}
            </p>

            <p className="text-lg font-semibold text-yellow-200">
              ⭐ {stars} {t('stars.total')}
            </p>

            {/* What just arrived comes before what comes next. A child who has
                only ever been told about the *following* threshold has no idea
                anything was won — they had to go and find the padlock gone. */}
            {justUnlocked.length > 0 && (
              // An OPAQUE plate. This sits on a translucent panel over a live
              // 3D scene, so a tinted wash would read at a different contrast
              // depending on what the pitch happened to be showing behind it.
              <div className="animate-pop-in flex flex-col items-center gap-1 self-stretch rounded-2xl bg-[#fde68a] px-4 py-3">
                <p className="text-base font-black text-[#241539]">🎁 {t('result.unlocked')}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {justUnlocked.map((item) => (
                    <span key={`${item.badge}-${item.unlockStars}`} className="text-5xl">
                      {item.badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {upcoming && (
              <p className="rounded-2xl bg-white/10 px-4 py-2 text-base font-semibold text-white/85">
                {t('result.next')} ⭐{upcoming.unlockStars} — {upcoming.badge}
              </p>
            )}

            <div className="mt-1 flex flex-col gap-3 self-stretch">
              <BigButton onClick={() => startRound(mode)}>⚽ {t('result.again')}</BigButton>
              <BigButton tone="secondary" onClick={goWardrobe}>
                👗 {t('result.wardrobe')}
              </BigButton>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
