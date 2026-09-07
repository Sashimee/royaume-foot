import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// The game is served from the ROOT of its own domain (https://foot.bas.lu), so
// the base is '/'. It used to be '/royaume-foot/', because GitHub Pages serves a
// project site from a path named after the repository; nothing else about the
// build depended on that, and moving to a domain of its own is what freed it.
const BASE = '/'

export default defineConfig({
  base: BASE,
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/react') || id.includes('node_modules/zustand')) return 'vendor'
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Royaume Foot',
        short_name: 'Royaume Foot',
        description: 'Un jeu de foot de princesses et de chevaliers, entièrement hors ligne.',
        lang: 'fr',
        start_url: BASE,
        scope: BASE,
        display: 'fullscreen',
        // Landscape and portrait both work, and a child holds a tablet however
        // they are holding it. Locking the orientation only produces a game that
        // refuses to be the shape it is being held in.
        orientation: 'any',
        background_color: '#4a1e6b',
        theme_color: '#ff8ec7',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Everything the game needs is a build artefact — there is no API and no
        // remote asset — so precaching the lot makes it work offline outright
        // rather than "offline once you have visited every screen".
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The three.js chunk alone is over the 2 MiB default, and leaving it out
        // of the precache is the difference between an installed game that runs
        // on a bus and one that shows a blank canvas.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
      // The dev server stays a plain dev server: a service worker there caches
      // the very files you are editing and hands them back after you change them.
      devOptions: { enabled: false },
    }),
  ],
})
