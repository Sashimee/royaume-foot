import { Canvas } from "@react-three/fiber";
import { useGame } from "../store/gameStore";
import { useSave } from "../store/saveStore";
import { characterById } from "../data/roster";
import { useT, useLangStore } from "../i18n/useLang";
import { LANGS } from "../i18n/translations";
import { Character } from "../three/Character";
import { BigButton, IconButton } from "./ui";
import { ScrollArea } from "./ScrollArea";
import { KingdomMap } from "./KingdomMap";
import { MODE_BADGES } from "./mapPlaces";
import { CUP_LEGS } from "../game/cup";

const SKY = "linear-gradient(180deg, #4a1e6b 0%, #a13b91 45%, #ff9ec4 100%)";

export function HomeScreen() {
  const t = useT();
  const startRound = useGame((s) => s.startRound);
  const goWardrobe = useGame((s) => s.goWardrobe);
  const startCup = useGame((s) => s.startCup);
  const character = useSave((s) => characterById(s.characterId));
  const stars = useSave((s) => s.stars);
  const muted = useSave((s) => s.muted);
  const toggleMute = useSave((s) => s.toggleMute);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: SKY }}>
      <div className="flex items-start justify-between p-4">
        <div className="flex items-center gap-2 rounded-full bg-black/25 px-4 py-2 backdrop-blur-sm">
          <span className="text-2xl font-black text-yellow-200">
            ⭐ {stars}
          </span>
        </div>
        <div className="flex gap-2">
          <IconButton
            label={muted ? t("sound.off") : t("sound.on")}
            onClick={toggleMute}
          >
            {muted ? "🔇" : "🔊"}
          </IconButton>
        </div>
      </div>

      <h1 className="animate-wobble text-balance px-6 text-center text-4xl font-black tracking-tight text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.3)]">
        👑 {t("app.title")} ⚽
      </h1>

      {/* The chosen princess, waving from the menu. A fixed height, like the
          wardrobe's showcase: with the map and the wardrobe below, a `flex-1`
          canvas was squeezed to zero on a phone and the character silently
          disappeared from the menu. The map took the height it gave up. */}
      <div className="h-32 shrink-0">
        <Canvas
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          camera={{ position: [0, 1.5, 3.6], fov: 45 }}
        >
          <hemisphereLight args={["#ffe9f6", "#7a4a9a", 1.2]} />
          <directionalLight position={[3, 6, 5]} intensity={1.1} />
          <Character data={character} showcase position={[0, -0.9, 0]} />
        </Canvas>
      </div>

      {/* Everything a child taps — the four places, the cup, the wardrobe — is
          above the fold on a 390×844 phone; the row of flags is not, and on a
          360×640 the cup and the wardrobe are not either. That is what
          ScrollArea is for: it fades its edge and floats an arrow rather than
          ending in a flat cut a child reads as the end of the screen. */}
      <ScrollArea className="px-4">
        <div className="flex flex-col items-center gap-2 pb-2">
          <p className="text-lg font-bold text-white/85">{t("home.pick")}</p>

          <KingdomMap onPick={startRound} />

          {/* The cup visits all four places, so it spans the width under the map
            rather than sitting on it as though it were a fifth destination. The
            badges are the map's own, in the order the road runs. */}
          <div className="flex w-full max-w-sm flex-col gap-2">
            <BigButton compact onClick={startCup}>
              🏆 {t("mode.cup")}
              <span className="ml-2 whitespace-nowrap text-base">
                {CUP_LEGS.map((mode) => MODE_BADGES[mode]).join(" ")}
              </span>
            </BigButton>
            <BigButton tone="secondary" onClick={goWardrobe}>
              👗 {t("home.wardrobe")}
            </BigButton>
          </div>

          <LangRow />
        </div>
      </ScrollArea>
    </div>
  );
}

function LangRow() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);

  return (
    <div className="mt-2 flex flex-wrap justify-center gap-2 px-3">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          aria-label={l.label}
          aria-pressed={l.code === lang}
          onClick={() => setLang(l.code)}
          className={`h-16 w-16 rounded-xl text-2xl transition ${
            l.code === lang ? "scale-110 bg-white/25" : "opacity-60"
          }`}
        >
          {l.flag}
        </button>
      ))}
    </div>
  );
}
