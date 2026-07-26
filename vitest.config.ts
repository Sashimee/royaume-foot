import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    // The game rules are pure TypeScript with no DOM access, so they run in
    // plain node — no jsdom dependency needed.
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['e2e'],
  },
})
