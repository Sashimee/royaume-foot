import { Canvas } from '@react-three/fiber'
import { useGame } from '../store/gameStore'
import { isUnlocked, useSave } from '../store/saveStore'
import { BALLS, CHARACTERS, characterById } from '../data/roster'
import { STADIUMS } from '../data/stadiums'
import { MASCOTS, mascotById } from '../data/mascots'
import { useT } from '../i18n/useLang'
import { Character } from '../three/Character'
import { Mascot } from '../three/Mascot'
import { BigButton, IconButton, PickCard } from './ui'

const SKY = 'linear-gradient(180deg, #3b1e6b 0%, #7b3ba1 50%, #ffb3d9 100%)'

/**
 * The dressing room — and, for this age group, the real reason to keep playing.
 * Locked items stay visible with the star price on them: a child needs to see
 * what they are playing *for*.
 */
export function WardrobeScreen() {
  const t = useT()
  const goHome = useGame((s) => s.goHome)
  const startRound = useGame((s) => s.startRound)

  const stars = useSave((s) => s.stars)
  const characterId = useSave((s) => s.characterId)
  const ballId = useSave((s) => s.ballId)
  const setCharacter = useSave((s) => s.setCharacter)
  const setBall = useSave((s) => s.setBall)
  const stadiumId = useSave((s) => s.stadiumId)
  const setStadium = useSave((s) => s.setStadium)
  const mascotId = useSave((s) => s.mascotId)
  const setMascot = useSave((s) => s.setMascot)

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: SKY }}>
      <div className="flex items-center justify-between p-4">
        <IconButton label={t('wardrobe.back')} onClick={goHome}>
          ⬅️
        </IconButton>
        <span className="rounded-full bg-black/25 px-4 py-2 text-2xl font-black text-yellow-200 backdrop-blur-sm">
          ⭐ {stars}
        </span>
      </div>

      <div className="h-48 shrink-0">
        <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 1.4, 3.4], fov: 45 }}>
          <hemisphereLight args={['#ffe9f6', '#7a4a9a', 1.2]} />
          <directionalLight position={[3, 6, 5]} intensity={1.1} />
          <Character data={characterById(characterId)} showcase position={[0, -0.95, 0]} />
          <Mascot data={mascotById(mascotId)} home={[1.15, -0.95, 0.3]} />
        </Canvas>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4" style={{ touchAction: 'pan-y' }}>
        <h2 className="mb-3 text-2xl font-black text-white">🧑‍🎤 {t('wardrobe.title')}</h2>
        <div className="mb-6 flex flex-wrap gap-3">
          {CHARACTERS.map((p) => (
            <PickCard
              key={p.id}
              badge={p.badge}
              name={p.name}
              selected={p.id === characterId}
              locked={!isUnlocked(p.unlockStars, stars)}
              lockedLabel={`⭐${p.unlockStars}`}
              onClick={() => setCharacter(p.id)}
            />
          ))}
        </div>

        <h2 className="mb-3 text-2xl font-black text-white">⚽ {t('wardrobe.balls')}</h2>
        <div className="mb-6 flex flex-wrap gap-3">
          {BALLS.map((b) => (
            <PickCard
              key={b.id}
              badge={b.badge}
              selected={b.id === ballId}
              locked={!isUnlocked(b.unlockStars, stars)}
              lockedLabel={`⭐${b.unlockStars}`}
              onClick={() => setBall(b.id)}
            />
          ))}
        </div>

        <h2 className="mb-3 text-2xl font-black text-white">🐾 {t('wardrobe.mascots')}</h2>
        <div className="mb-6 flex flex-wrap gap-3">
          {MASCOTS.map((m) => (
            <PickCard
              key={m.id}
              badge={m.badge}
              selected={m.id === mascotId}
              locked={!isUnlocked(m.unlockStars, stars)}
              lockedLabel={`⭐${m.unlockStars}`}
              onClick={() => setMascot(m.id)}
            />
          ))}
        </div>

        <h2 className="mb-3 text-2xl font-black text-white">🏟️ {t('wardrobe.stadiums')}</h2>
        <div className="flex flex-wrap gap-3">
          {STADIUMS.map((st) => (
            <PickCard
              key={st.id}
              badge={st.badge}
              selected={st.id === stadiumId}
              locked={!isUnlocked(st.unlockStars, stars)}
              lockedLabel={`⭐${st.unlockStars}`}
              onClick={() => setStadium(st.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center p-5 pb-8">
        <BigButton onClick={() => startRound('shoot')}>⚽ {t('wardrobe.play')}</BigButton>
      </div>
    </div>
  )
}
