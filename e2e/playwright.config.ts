import { defineConfig, devices } from '@playwright/test'

const PORT = 5173
const BASE = `http://localhost:${PORT}/royaume-foot/`

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // A phone held upright: the shape the game is actually designed for.
    viewport: { width: 390, height: 844 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        launchOptions: {
          // CI runners have no GPU; without a software rasteriser the WebGL
          // context never initialises and every test fails on a blank canvas.
          args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
          // Escape hatch for sandboxes that ship a pre-installed Chromium at a
          // different build number than the one Playwright expects.
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
        },
      },
    },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    cwd: '..',
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
