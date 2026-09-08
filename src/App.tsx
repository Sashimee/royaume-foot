import { useEffect } from 'react'
import { setMuted } from './audio/sfx'
import { useGame } from './store/gameStore'
import type { Screen } from './store/gameStore'
import { useSave } from './store/saveStore'
import { useLangStore } from './i18n/useLang'
import { HomeScreen } from './ui/HomeScreen'
import { PlayScreen } from './ui/PlayScreen'
import { WardrobeScreen } from './ui/WardrobeScreen'

export default function App() {
  const screen = useGame((s) => s.screen)
  const muted = useSave((s) => s.muted)
  const lang = useLangStore((s) => s.lang)

  useEffect(() => setMuted(muted), [muted])
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <div className="relative h-full w-full overflow-hidden">{screenFor(screen)}</div>
  )
}

/**
 * Which screen is showing.
 *
 * A `switch` with an exhaustiveness check, not a list of `&&`s, because the
 * list silently lost one: `trophy` was added for the Coupe du Royaume and never
 * added here, so finishing the cup unmounted everything and left a child
 * staring at an empty page at the exact moment they had won. The `never` below
 * turns that into a compile error the next time a screen is added.
 */
function screenFor(screen: Screen) {
  switch (screen) {
    case 'home':
      return <HomeScreen />
    case 'wardrobe':
      return <WardrobeScreen />
    // The result and trophy panels are overlays, so the pitch stays visible
    // behind them — which is why they keep PlayScreen mounted.
    case 'play':
    case 'result':
    case 'trophy':
      return <PlayScreen />
    default: {
      const unhandled: never = screen
      return unhandled
    }
  }
}
