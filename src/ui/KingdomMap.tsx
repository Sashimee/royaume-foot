import { sfx } from '../audio/sfx'
import { useT } from '../i18n/useLang'
import type { GameMode } from '../store/gameStore'
import { MAP, MODE_BADGES, PLACES } from './mapPlaces'

/**
 * The Carte du Royaume: the four mini-games as four places you can go.
 *
 * It replaced a grid of four identical buttons that differed only by their
 * label and their emoji. A child who cannot read had nothing to remember them
 * by; on a map the shooting pitch is *up by the castle* and the star meadow is
 * *down on the left*, which is a memory a six-year-old already has for the
 * rooms of a house. Choosing a game is still one tap from the menu — the map is
 * the picker, not a screen on the way to it, because the age rules cap the menu
 * at two levels.
 *
 * The dashed road joins the places in the cup's running order, so the Coupe du
 * Royaume reads as a journey across the map rather than as a fifth game.
 */
export function KingdomMap({ onPick }: { onPick: (mode: GameMode) => void }) {
  const t = useT()

  return (
    // The box holds the SVG's aspect ratio, so `preserveAspectRatio="none"`
    // never actually distorts anything and the medallions can be placed in
    // percentages of the very coordinates the art is drawn in.
    <div
      className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border-4 border-white/35
        shadow-[0_8px_0_rgba(0,0,0,0.25)]"
      style={{ aspectRatio: `${MAP.width} / ${MAP.height}` }}
    >
      <MapArt />

      {PLACES.map((place) => (
        <button
          key={place.mode}
          type="button"
          aria-label={t(place.labelKey)}
          onClick={() => {
            sfx.tap()
            onPick(place.mode)
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/90
            text-4xl shadow-[0_5px_0_rgba(0,0,0,0.3)] transition active:translate-y-[calc(-50%+3px)]
            active:shadow-[0_2px_0_rgba(0,0,0,0.3)]"
          style={{
            left: `${(place.x / MAP.width) * 100}%`,
            top: `${(place.y / MAP.height) * 100}%`,
            width: MAP.medallion,
            height: MAP.medallion,
            background: place.tint,
          }}
        >
          {MODE_BADGES[place.mode]}
          {/* An OPAQUE plate. The name sits over grass, sand or ice depending on
              the place, and a translucent chip's contrast would be a different
              number on each one. It hangs outside the button so the tap target
              stays a clean circle. */}
          <span
            className="absolute left-1/2 top-full mt-1 -translate-x-1/2 rounded-full bg-[#241539]
              px-2 py-0.5 text-center text-[13px] font-black leading-tight text-white"
            style={{ width: MAP.labelWidth }}
          >
            {t(place.labelKey)}
          </span>
        </button>
      ))}
    </div>
  )
}

const ISLAND =
  'M 34 62 C 62 26, 122 16, 180 28 C 238 40, 302 22, 330 60 C 352 90, 342 148, 334 196 ' +
  'C 326 244, 338 288, 292 300 C 234 314, 152 302, 98 300 C 46 298, 14 268, 20 214 ' +
  'C 26 158, 12 98, 34 62 Z'

const TUFTS: [number, number][] = [
  [44, 112],
  [150, 126],
  [214, 148],
  [238, 198],
  [176, 262],
  [288, 186],
]

/** The road, through the places in the order `PLACES` lists them. */
const ROAD =
  'M 95 80 C 140 98, 214 102, 262 124 C 236 168, 152 158, 88 204 C 140 246, 200 214, 258 240'

function MapArt() {
  return (
    <svg
      viewBox={`0 0 ${MAP.width} ${MAP.height}`}
      preserveAspectRatio="none"
      aria-hidden
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="km-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f74b4" />
          <stop offset="100%" stopColor="#1c4d88" />
        </linearGradient>
        <linearGradient id="km-land" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ccb74" />
          <stop offset="100%" stopColor="#55ae5c" />
        </linearGradient>
        <clipPath id="km-island">
          <path d={ISLAND} />
        </clipPath>
      </defs>

      <rect width={MAP.width} height={MAP.height} fill="url(#km-sea)" />
      <g stroke="#bfe4ff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.55">
        <path d="M 24 310 q 7 -6 14 0 q 7 6 14 0" />
        <path d="M 310 308 q 7 -6 14 0 q 7 6 14 0" />
        <path d="M 8 148 q 7 -6 14 0" />
      </g>

      {/* The sand stroke straddles the coastline, so one path draws both the
          beach and the island's outline. */}
      <path d={ISLAND} fill="url(#km-land)" stroke="#f0dfab" strokeWidth="11" />

      <g clipPath="url(#km-island)">
        {/* The four stadiums a child can unlock are prairie, beach, ice and
            starry night; the map is the same kingdom, so it carries the same
            places. */}
        <path
          d="M 236 10 C 250 60, 276 92, 306 108 C 334 122, 356 148, 362 186 L 362 0 Z"
          fill="#eaf4ff"
        />
        <path d="M 266 96 L 290 52 L 314 96 Z" fill="#d3e6f7" stroke="#b5d3ec" strokeWidth="2" />
        <path d="M 278 74 L 290 52 L 302 74 Z" fill="#ffffff" />
        <path d="M 314 118 L 332 78 L 350 118 Z" fill="#dceefb" stroke="#b5d3ec" strokeWidth="2" />
        <path d="M 323 98 L 332 78 L 341 98 Z" fill="#ffffff" />

        <path
          d="M 302 128 C 290 158, 308 184, 298 212 C 288 242, 302 272, 316 300"
          stroke="#8ccdef"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />

        <Tree x={168} y={182} />
        <Tree x={192} y={166} />
        <Tree x={146} y={166} />
        <Tree x={196} y={198} />

        {/* The star meadow and the tower field: each place gets a landmark of
            its own, so the map still says where you are once the medallion is
            under a thumb. */}
        <g fill="#ffe066">
          <Sparkle x={42} y={176} />
          <Sparkle x={138} y={192} />
          <Sparkle x={128} y={240} />
        </g>
        {/* Grass tufts, kept clear of the road and of the name plates: an
            empty green field reads as a placeholder rather than as a meadow. */}
        <g stroke="#3f9a52" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7">
          {TUFTS.map(([x, y]) => (
            <path key={`${x}-${y}`} d={`M ${x - 5} ${y} l 4 -7 M ${x + 1} ${y} l 4 -7`} />
          ))}
        </g>

        <g fill="#b9aec9" stroke="#6b5f85" strokeWidth="2">
          <rect x={200} y={244} width={13} height={13} rx={2} />
          <rect x={200} y={230} width={13} height={13} rx={2} />
          <rect x={216} y={250} width={13} height={13} rx={2} transform="rotate(24 222 256)" />
        </g>
      </g>

      {/* The coastline again, over the snow: the beach is a stroke that
          straddles the island's edge, so a region filled up to that edge eats
          its inner half and the shore quietly disappears behind it. */}
      <path d={ISLAND} fill="none" stroke="#f0dfab" strokeWidth="11" />

      <Castle />

      <path d={ROAD} stroke="#7a5c22" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.3" />
      <path
        d={ROAD}
        stroke="#ffe9a8"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="10 9"
        fill="none"
      />
    </svg>
  )
}

/** The same palette as the castle behind the goal, so it reads as that castle. */
function Castle() {
  return (
    <g>
      <rect x={148} y={44} width={17} height={42} fill="#e3ccf7" />
      <rect x={201} y={44} width={17} height={42} fill="#e3ccf7" />
      <path d="M 144 45 L 156 26 L 169 45 Z" fill="#db2777" />
      <path d="M 197 45 L 209 26 L 222 45 Z" fill="#db2777" />
      <rect x={163} y={58} width={40} height={28} fill="#cdb0ea" />
      {/* Crenellations. Without the notched top this was a house with two
          pointed hats, which is a different building entirely. */}
      <g fill="#cdb0ea">
        <rect x={163} y={52} width={9} height={7} />
        <rect x={178} y={52} width={9} height={7} />
        <rect x={193} y={52} width={10} height={7} />
      </g>
      <path d="M 176 86 L 176 72 a 7 7 0 0 1 14 0 L 190 86 Z" fill="#5b2f8f" />
      <path d="M 156 26 L 156 14" stroke="#5b2f8f" strokeWidth="2" />
      <path d="M 156 14 L 170 18 L 156 22 Z" fill="#ffd34d" />
    </g>
  )
}

function Tree({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 2} y={y} width={4} height={7} fill="#7a4a2a" />
      <path d={`M ${x - 11} ${y + 2} L ${x} ${y - 22} L ${x + 11} ${y + 2} Z`} fill="#3f8f4a" />
    </g>
  )
}

function Sparkle({ x, y }: { x: number; y: number }) {
  const d =
    `M ${x} ${y - 9} L ${x + 3} ${y - 3} L ${x + 9} ${y} L ${x + 3} ${y + 3} ` +
    `L ${x} ${y + 9} L ${x - 3} ${y + 3} L ${x - 9} ${y} L ${x - 3} ${y - 3} Z`
  return <path d={d} />
}
