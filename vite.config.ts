import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served from https://sashimee.github.io/royaume-foot/ — this must match the
// repository name, or every asset URL 404s on GitHub Pages.
const BASE = '/royaume-foot/'

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
  plugins: [react(), tailwindcss()],
})
