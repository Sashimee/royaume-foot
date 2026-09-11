import { useCallback, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { sfx } from '../audio/sfx'
import { ROUND, RUN, TOWER } from '../game/constants'
import type { ShotOutcome } from '../game/scoring'
import type { GameMode } from '../store/gameStore'
import { shoutKeyFor, useGame } from '../store/gameStore'
import type { RoundOutcome } from '../store/gameStore'
import { useSave } from '../store/saveStore'
import { ballById, characterById } from '../data/roster'
import { stadiumById } from '../data/stadiums'
import { mascotById } from '../data/mascots'
import { keeperById } from '../data/keepers'
import { accessoryById } from '../data/accessories'
import { useT } from '../i18n/useLang'
import { Scene } from '../three/Scene'
import { Pitch } from '../three/Pitch'
import { Crowd } from '../three/Crowd'
import { Match } from '../three/Match'
import type { MatchHandle } from '../three/Match'
import { KeepMatch } from '../three/KeepMatch'
import type { KeepHandle } from '../three/KeepMatch'
import { RunMatch } from '../three/RunMatch'
import type { RunHandle } from '../three/RunMatch'
import { TowerMatch } from '../three/TowerMatch'
import type { TowerHandle } from '../three/TowerMatch'
import { AimOverlay } from './AimOverlay'
import { KeepOverlay } from './KeepOverlay'
import { RunHud } from './RunHud'
import { ResultScreen } from './ResultScreen'
import { TrophyScreen } from './TrophyScreen'
import { CupBanner } from './CupBanner'
import { IconButton } from './ui'

export function PlayScreen() {
  const t = useT()
  const api = useRef<MatchHandle | null>(null)
  const keepApi = useRef<KeepHandle | null>(null)
  const runApi = useRef<RunHandle | null>(null)
  const towerApi = useRef<TowerHandle | null>(null)
  const cheerUntil = useRef(0)

  const character = useSave((s) => characterById(s.characterId))
  const ballSkin = useSave((s) => ballById(s.ballId))
  const stadium = useSave((s) => stadiumById(s.stadiumId))
  const mascot = useSave((s) => mascotById(s.mascotId))
  const keeper = useSave((s) => keeperById(s.keeperId))
  const accessory = useSave((s) => accessoryById(s.accessoryId))
  const addStars = useSave((s) => s.addStars)

  const screen = useGame((s) => s.screen)
  const mode = useGame((s) => s.mode)
  const shotsTaken = useGame((s) => s.shotsTaken)
  const goals = useGame((s) => s.goals)
  const earnedStars = useGame((s) => s.earnedStars)
  const recordShot = useGame((s) => s.recordShot)
  const recordSave = useGame((s) => s.recordSave)
  const recordSmash = useGame((s) => s.recordSmash)
  const collectStar = useGame((s) => s.collectStar)
  const finishRun = useGame((s) => s.finishRun)
  const finishRound = useGame((s) => s.finishRound)
  const goHome = useGame((s) => s.goHome)

  const cupLeg = useGame((s) => s.cupLeg)
  const roundOver = useGame((s) => s.roundOver)
  const awarded = useRef(false)

  const handleOutcome = useCallback(
    (outcome: ShotOutcome, target: string | null) => {
      recordShot(outcome, target)
      if (outcome === 'goal') {
        sfx.goal()
        burst()
        if (target) {
          sfx.crown()
          burst(0.35)
        }
      } else if (outcome === 'post') {
        sfx.post()
      } else {
        sfx.save()
      }
    },
    [recordShot],
  )

  const handleSave = useCallback(
    (saved: boolean) => {
      recordSave(saved)
      if (saved) {
        sfx.goal()
        burst()
      } else {
        sfx.save()
      }
    },
    [recordSave],
  )

  const handleSmash = useCallback(
    (knocked: number) => {
      recordSmash(knocked)
      if (knocked > 0) {
        sfx.goal()
        burst(Math.min(1.4, 0.5 + knocked * 0.25))
      } else {
        sfx.save()
      }
    },
    [recordSmash],
  )

  const handleCollect = useCallback(
    (big: boolean) => {
      collectStar(big)
      if (big) sfx.crown()
      else sfx.star()
    },
    [collectStar],
  )

  const handleRunFinish = useCallback(
    (collected: number, big: number) => {
      finishRun(collected, big)
      sfx.goal()
      burst()
    },
    [finishRun],
  )

  // Let the last celebration play out before the result panel slides in.
  useEffect(() => {
    if (!roundOver || screen !== 'play' || awarded.current) return
    awarded.current = true
    const id = window.setTimeout(() => {
      addStars(earnedStars)
      sfx.star()
      finishRound()
    }, 1900)
    return () => window.clearTimeout(id)
  }, [roundOver, screen, earnedStars, addStars, finishRound])

  // Re-arm for the next round. PlayScreen stays mounted across "Again!" and
  // across every leg of the cup, so a mount-only reset would silently stop
  // awarding stars from round two onwards.
  //
  // This watches `roundOver` and NOT `shotsTaken`. The runner never increments
  // `shotsTaken` — it ends on a clock — so it sat at 0 for the whole run leg
  // and stayed 0 going into the next round. The effect therefore never re-ran,
  // `awarded` stayed true, and the round after a run could never finish: no
  // stars, no result screen, no trophy. In the Coupe du Royaume the runner is
  // leg three, so the cup died at the end of leg four, one screen short of the
  // thing the child had been playing four games for.
  useEffect(() => {
    if (!roundOver) awarded.current = false
  }, [roundOver])

  return (
    <div className="absolute inset-0">
      <Scene sky={stadium.sky}>
        <Pitch stadium={stadium} showTargets={mode === 'shoot'} showGoal={mode !== 'run' && mode !== 'tower'} />
        <Crowd cheerUntil={cheerUntil} />
        {mode === 'shoot' ? (
          <Match
            api={api}
            character={character}
            accessory={accessory}
            keeper={keeper}
            ballSkin={ballSkin}
            shadowColour={stadium.shadow}
            mascot={mascot}
            frozen={roundOver}
            cheerUntil={cheerUntil}
            onOutcome={handleOutcome}
          />
        ) : mode === 'keep' ? (
          <KeepMatch
            api={keepApi}
            character={character}
            accessory={accessory}
            shooter={keeper}
            ballSkin={ballSkin}
            shadowColour={stadium.shadow}
            mascot={mascot}
            frozen={roundOver}
            cheerUntil={cheerUntil}
            onResult={handleSave}
          />
        ) : mode === 'tower' ? (
          <TowerMatch
            api={towerApi}
            character={character}
            accessory={accessory}
            ballSkin={ballSkin}
            shadowColour={stadium.shadow}
            mascot={mascot}
            frozen={roundOver}
            cheerUntil={cheerUntil}
            onSmash={handleSmash}
          />
        ) : (
          <RunMatch
            api={runApi}
            character={character}
            accessory={accessory}
            ballSkin={ballSkin}
            shadowColour={stadium.shadow}
            mascot={mascot}
            frozen={roundOver}
            cheerUntil={cheerUntil}
            onCollect={handleCollect}
            onFinish={handleRunFinish}
          />
        )}
      </Scene>

      {screen === 'play' &&
        (mode === 'shoot' ? (
          <AimOverlay
            hint={t('play.hint')}
            canShoot={() => api.current?.isReady() ?? false}
            onShoot={(shot) => {
              sfx.kick()
              api.current?.shoot(shot)
            }}
          />
        ) : mode === 'tower' ? (
          <AimOverlay
            hint={t('tower.hint')}
            canShoot={() => towerApi.current?.isReady() ?? false}
            onShoot={(shot) => {
              sfx.kick()
              towerApi.current?.shoot(shot)
            }}
          />
        ) : mode === 'keep' ? (
          <KeepOverlay hint={t('keep.hint')} onAim={(x) => keepApi.current?.aimAt(x)} />
        ) : (
          <KeepOverlay hint={t('run.hint')} halfWidth={RUN.laneHalfWidth} onAim={(x) => runApi.current?.aimAt(x)} />
        ))}

      <Hud
        shotsTaken={shotsTaken}
        goals={goals}
        mode={mode}
        cupLeg={screen === 'play' ? cupLeg : null}
        onQuit={goHome}
        progress={() => runApi.current?.progress() ?? 0}
      />
      <Shout />

      {screen === 'result' && <ResultScreen />}
      {screen === 'trophy' && <TrophyScreen />}
    </div>
  )
}

function Hud({
  shotsTaken,
  goals,
  mode,
  cupLeg,
  onQuit,
  progress,
}: {
  shotsTaken: number
  goals: number
  mode: GameMode
  /** Which leg of the Coupe du Royaume this is, or null outside the cup. */
  cupLeg: number | null
  onQuit: () => void
  /** Runner mode only: how far through the run we are, 0..1. */
  progress: () => number
}) {
  const stars = useSave((s) => s.stars)

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
      <div className="pointer-events-auto">
        <IconButton label="Menu" onClick={onQuit}>
          🏠
        </IconButton>
      </div>

      <div className="flex flex-col items-end gap-2">
        {/* Shots remaining, as balls. No numbers needed to read it. */}
        {/* The runner has no attempts to count down — it ends on a clock. */}
        {mode === 'run' ? (
          <RunHud progress={progress} />
        ) : (
          <div data-testid="shots" className="flex gap-1 rounded-full bg-black/30 px-4 py-2 backdrop-blur-sm" role="img"
            aria-label={`${shotsFor(mode) - shotsTaken} / ${shotsFor(mode)}`}>
            {Array.from({ length: shotsFor(mode) }, (_, i) => (
              <span key={i} className={`text-2xl ${i < shotsTaken ? 'opacity-25 grayscale' : ''}`}>
                ⚽
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 rounded-full bg-black/30 px-4 py-2 backdrop-blur-sm">
          <span className="text-2xl font-black text-white">
            {mode === 'shoot' ? '🥅' : mode === 'keep' ? '🧤' : mode === 'tower' ? '🧱' : '✨'} {goals}
          </span>
          <span className="text-2xl font-black text-yellow-200">⭐ {stars}</span>
        </div>
        {cupLeg !== null && <CupBanner leg={cupLeg} />}
      </div>
    </div>
  )
}

/** How many attempts a round of this mode gets. */
function shotsFor(mode: GameMode): number {
  return mode === 'tower' ? TOWER.shotsPerRound : ROUND.shotsPerRound
}

/**
 * The picture that goes with each shout, so none of them is words alone.
 * Warm on the misses on purpose: 👏 and 💪 congratulate the attempt, and
 * nothing here is allowed to read as a telling-off.
 */
const SHOUT_EMOJI: Record<RoundOutcome, string> = {
  goal: '🎉',
  saved: '🎉',
  smash: '🎉',
  save: '👏',
  conceded: '💪',
  nudge: '👏',
  post: '😮',
  over: '💪',
  wide: '💪',
}

/** The big shout after each shot. Keyed on shoutId so it replays every time. */
function Shout() {
  const t = useT()
  const outcome = useGame((s) => s.lastOutcome)
  const shoutId = useGame((s) => s.shoutId)
  const clearShout = useGame((s) => s.clearShout)

  useEffect(() => {
    if (!outcome) return
    const id = window.setTimeout(clearShout, 1500)
    return () => window.clearTimeout(id)
  }, [outcome, shoutId, clearShout])

  if (!outcome) return null

  return (
    // Top third, not dead centre: centred, the shout landed squarely on the
    // toppling tower or the diving keeper — the one second of payoff the child
    // is actually watching for, hidden behind a word they cannot read. The band
    // above the goal is empty sky in every mode.
    //
    // It clears the whole HUD stack, not just the two rows that used to be
    // there: inside the cup the stack grows a third row, and a shout as short
    // as "Saved!" already reached across it on a 390-wide phone. A longer
    // translation reaches further, so this is measured against the stack's
    // height rather than the widest string.
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-44">
      <p
        key={shoutId}
        className="animate-pop-in max-w-[92vw] break-words text-center text-[clamp(2rem,11vw,3.75rem)]
          font-black tracking-tight text-white drop-shadow-[0_6px_0_rgba(0,0,0,0.35)]"
      >
        {/* Every outcome carries a picture. Rule 2 is not "most controls" — a
            save, a miss and a post used to be a bare white word, which is the
            game's most frequent moment and its only text-only one. To a
            non-reader the pattern read as "sometimes a party, sometimes a
            blob", and the blob is exactly the punishment rule 3 forbids. */}
        {SHOUT_EMOJI[outcome]}{' '}
        {t(shoutKeyFor(outcome))}
      </p>
    </div>
  )
}

/** Party colours, aimed up from the bottom of the screen. */
function burst(scale = 1) {
  confetti({
    particleCount: Math.round(90 * scale),
    spread: 95,
    startVelocity: 45,
    origin: { y: 0.75 },
    colors: ['#ff8ec7', '#ffd84d', '#8be0d0', '#c58cff', '#ffffff'],
    disableForReducedMotion: true,
  })
}
