import { useState } from 'react'
import type { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGame } from '../store/gameStore'
import { isUnlocked, useSave } from '../store/saveStore'
import { BALLS, KNIGHTS, PRINCESSES, characterById } from '../data/roster'
import { STADIUMS } from '../data/stadiums'
import { MASCOTS, mascotById } from '../data/mascots'
import { useT } from '../i18n/useLang'
import type { TranslationKey } from '../i18n/translations'
import { Character } from '../three/Character'
import { Mascot } from '../three/Mascot'
import { BigButton, IconButton, PickCard } from './ui'
import { ScrollArea } from './ScrollArea'
import { ResetStars } from './ResetStars'

const SKY = 'linear-gradient(180deg, #3b1e6b 0%, #7b3ba1 50%, #ffb3d9 100%)'

type Tab = 'characters' | 'balls' | 'stadiums' | 'mascots'

const TABS: { id: Tab; badge: string; label: TranslationKey }[] = [
  { id: 'characters', badge: '👑', label: 'wardrobe.title' },
  { id: 'balls', badge: '⚽', label: 'wardrobe.balls' },
  { id: 'stadiums', badge: '🏟️', label: 'wardrobe.stadiums' },
  { id: 'mascots', badge: '🐾', label: 'wardrobe.mascots' },
]

/**
 * The dressing room — and, for this age group, the real reason to keep playing.
 *
 * Split into tabs after a playtest: everything used to live in one long scroll
 * and a child had no way of knowing there was more below the fold. Locked items
 * stay visible with their star price, because a child needs to see what they
 * are playing *for*.
 */
export function WardrobeScreen() {
  const t = useT()
  const goHome = useGame((s) => s.goHome)
  const startRound = useGame((s) => s.startRound)
  const [tab, setTab] = useState<Tab>('characters')

  const stars = useSave((s) => s.stars)
  const characterId = useSave((s) => s.characterId)
  const ballId = useSave((s) => s.ballId)
  const stadiumId = useSave((s) => s.stadiumId)
  const mascotId = useSave((s) => s.mascotId)
  const setCharacter = useSave((s) => s.setCharacter)
  const setBall = useSave((s) => s.setBall)
  const setStadium = useSave((s) => s.setStadium)
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

      <div className="h-40 shrink-0">
        <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 1.4, 3.4], fov: 45 }}>
          <hemisphereLight args={['#ffe9f6', '#7a4a9a', 1.2]} />
          <directionalLight position={[3, 6, 5]} intensity={1.1} />
          <Character data={characterById(characterId)} showcase position={[0, -0.95, 0]} />
          <Mascot data={mascotById(mascotId)} home={[0.95, -0.95, 0.45]} />
        </Canvas>
      </div>

      <TabBar tab={tab} onPick={setTab} />

      {/* `key` remounts the scroller on every tab change, so a new tab always
          starts at the top and re-runs its own "there is more below" check. */}
      <ScrollArea key={tab} className="min-h-0 flex-1 px-5">
        {tab === 'characters' && (
          <>
            <Section title={`👑 ${t('wardrobe.princesses')}`}>
              {PRINCESSES.map((p) => (
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
            </Section>
            <Section title={`⚔️ ${t('wardrobe.knights')}`}>
              {KNIGHTS.map((k) => (
                <PickCard
                  key={k.id}
                  badge={k.badge}
                  name={k.name}
                  selected={k.id === characterId}
                  locked={!isUnlocked(k.unlockStars, stars)}
                  lockedLabel={`⭐${k.unlockStars}`}
                  onClick={() => setCharacter(k.id)}
                />
              ))}
            </Section>
          </>
        )}

        {tab === 'balls' && (
          <Section title={`⚽ ${t('wardrobe.balls')}`}>
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
          </Section>
        )}

        {tab === 'stadiums' && (
          <Section title={`🏟️ ${t('wardrobe.stadiums')}`}>
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
          </Section>
        )}

        {tab === 'mascots' && (
          <>
            <Section title={`🐾 ${t('wardrobe.mascots')}`}>
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
            </Section>
            <ResetStars />
          </>
        )}
      </ScrollArea>

      <div className="flex justify-center p-5 pb-8">
        <BigButton onClick={() => startRound('shoot')}>⚽ {t('wardrobe.play')}</BigButton>
      </div>
    </div>
  )
}

function TabBar({ tab, onPick }: { tab: Tab; onPick: (t: Tab) => void }) {
  const t = useT()
  return (
    <div className="flex shrink-0 gap-2 px-4 pb-3" role="tablist">
      {TABS.map((entry) => (
        <button
          key={entry.id}
          type="button"
          role="tab"
          aria-selected={tab === entry.id}
          aria-label={t(entry.label)}
          onClick={() => onPick(entry.id)}
          className={`flex h-16 flex-1 items-center justify-center rounded-2xl border-4 text-3xl transition
            ${tab === entry.id ? 'border-yellow-300 bg-white/25' : 'border-white/20 bg-white/10 opacity-70'}`}
        >
          {entry.badge}
        </button>
      ))}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 text-2xl font-black text-white">{title}</h2>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  )
}
