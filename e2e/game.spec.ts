import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// The home screen now offers a mini-game each; this is the shooting one.
const PLAY = /Tirer|Shoot|Schießen|Tirar|Rematar/i

/** Shots remaining, read off the HUD's accessible label ("3 / 5"). */
async function shotsLeft(page: Page): Promise<number> {
  const label = await page.getByTestId('shots').getAttribute('aria-label')
  return Number(label?.split('/')[0].trim())
}

/**
 * Flicks towards the goal and waits for the shot to be judged.
 *
 * A flick that lands while the previous ball is still in play is ignored by
 * design, so this retries until the HUD actually ticks down rather than
 * sleeping for a guessed interval.
 */
async function takeShot(page: Page, dx: number, dy: number) {
  const before = await shotsLeft(page)

  await expect
    .poll(
      async () => {
        await page.mouse.move(195, 700)
        await page.mouse.down()
        for (let i = 1; i <= 6; i++) {
          await page.mouse.move(195 + (dx * i) / 6, 700 - (dy * i) / 6)
        }
        await page.mouse.up()
        // Slightly longer than a full shot cycle (flight + celebration),
        // so the first attempt normally lands instead of re-flicking.
        await page.waitForTimeout(3200)
        return await shotsLeft(page)
      },
      { timeout: 30_000, message: 'the shot was never judged' },
    )
    .toBeLessThan(before)
}

test.describe('Royaume Foot', () => {
  test('boots into a 3D menu with no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

    await page.goto('./')
    await expect(page.locator('canvas')).toBeVisible()

    // The menu renders the chosen princess, so a live WebGL context matters.
    const hasContext = await page.evaluate(() => {
      const c = document.querySelector('canvas')!
      return !!(c.getContext('webgl2') ?? c.getContext('webgl'))
    })
    expect(hasContext).toBe(true)
    expect(errors).toEqual([])
  })

  test('plays a full round and always ends in a reward', async ({ page }) => {
    // Five shots, each with a ~3s flight-and-celebrate cycle, is well past
    // Playwright's 30s default.
    test.setTimeout(150_000)

    await page.goto('./')
    await page.getByRole('button', { name: PLAY }).first().click()

    await expect(page.getByTestId('shots')).toBeVisible()
    expect(await shotsLeft(page)).toBe(5)

    // Deliberately spread across the goal, including the far corners.
    const flicks: [number, number][] = [
      [0, 260],
      [-80, 240],
      [80, 300],
      [-40, 340],
      [40, 220],
    ]
    for (const [dx, dy] of flicks) await takeShot(page, dx, dy)

    expect(await shotsLeft(page)).toBe(0)

    // Whatever happened, the round ends on a celebration and at least one star.
    const again = page.getByRole('button', { name: /Encore|Again|Nochmal|Otra vez|Ancora|Outra/ })
    await expect(again).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/⭐/).first()).toBeVisible()
  })

  test('keeps the wardrobe reachable and remembers the choice', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: /habiller|Dress up|Anziehen|Vestir|Vestire/ }).first().click()

    // Amara is unlocked from the start; Freya costs stars and must stay locked.
    const amara = page.getByRole('button', { name: 'Amara' })
    await expect(amara).toBeEnabled()
    await amara.click()
    await expect(amara).toHaveAttribute('aria-pressed', 'true')

    await expect(page.getByRole('button', { name: /Freya/ })).toBeDisabled()

    // Knights share the picker with the princesses, and one is free from the
    // start so a child who wants a knight can have one immediately.
    const lancelot = page.getByRole('button', { name: 'Lancelot' })
    await expect(lancelot).toBeEnabled()
    await lancelot.click()
    await expect(lancelot).toHaveAttribute('aria-pressed', 'true')
    await expect(amara).toHaveAttribute('aria-pressed', 'false')

    await page.reload()
    await page.getByRole('button', { name: /habiller|Dress up|Anziehen|Vestir|Vestire/ }).first().click()
    await expect(page.getByRole('button', { name: 'Lancelot' })).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('Gardienne du château', () => {
  const KEEP_MODE = /gardienne|keeper|Torfrau|portera|portiera|guarda-redes/i

  test('plays a keeping round and always ends in a reward', async ({ page }) => {
    // Each attempt is a wind-up + flight + celebration cycle of ~3.5s.
    test.setTimeout(150_000)

    await page.goto('./')
    await page.getByRole('button', { name: KEEP_MODE }).first().click()

    await expect(page.getByTestId('shots')).toBeVisible()
    expect(await shotsLeft(page)).toBe(5)

    // Sweep her across the goal. The point is not to save — it is that the
    // control responds and the round always completes.
    for (let i = 0; i < 5; i++) {
      const x = i % 2 === 0 ? 90 : 300
      await page.mouse.move(x, 620)
      await page.mouse.down()
      await page.mouse.move(x === 90 ? 300 : 90, 620)
      await page.mouse.up()
      await expect
        .poll(async () => shotsLeft(page), { timeout: 20_000 })
        .toBeLessThanOrEqual(4 - i)
    }

    const again = page.getByRole('button', { name: /Encore|Again|Nochmal|Otra vez|Ancora|Outra/ })
    await expect(again).toBeVisible({ timeout: 15_000 })
    // No fail state: even a round with no saves at all pays out a star.
    await expect(page.getByText(/⭐/).first()).toBeVisible()
  })

  test('offers both mini-games from the menu', async ({ page }) => {
    await page.goto('./')
    await expect(page.getByRole('button', { name: /tirer|shoot|schießen|rematar/i })).toBeVisible()
    await expect(page.getByRole('button', { name: KEEP_MODE })).toBeVisible()
  })
})

test.describe('Course aux étoiles', () => {
  const RUN_MODE = /course aux étoiles|star run|sternenlauf|carrera de estrellas|corsa alle stelle|corrida às estrelas/i

  test('runs to the clock and always ends in a reward', async ({ page }) => {
    // The run lasts 24 seconds by design, plus mount and the result panel.
    test.setTimeout(150_000)

    await page.goto('./')
    await page.getByRole('button', { name: RUN_MODE }).first().click()

    // It ends on a clock, so it has a time bar instead of a count of attempts.
    await expect(page.getByTestId('run-timer')).toBeVisible()
    await expect(page.getByTestId('shots')).toHaveCount(0)

    // Sweep across the lane while the run plays out.
    for (let i = 0; i < 10; i++) {
      const x = i % 2 === 0 ? 90 : 300
      await page.mouse.move(x, 620)
      await page.mouse.down()
      await page.mouse.move(x === 90 ? 300 : 90, 620)
      await page.mouse.up()
      await page.waitForTimeout(1200)
    }

    const again = page.getByRole('button', { name: /Encore|Again|Nochmal|Otra vez|Ancora|Outra/ })
    await expect(again).toBeVisible({ timeout: 40_000 })
    // No fail state here either: a run always pays out at least one star.
    await expect(page.getByText(/⭐/).first()).toBeVisible()
  })

  test('offers all three mini-games from the menu', async ({ page }) => {
    await page.goto('./')
    await expect(page.getByRole('button', { name: /tirer|shoot|schießen|rematar/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /gardienne|keeper|Torfrau|portera|portiera|guarda-redes/i })).toBeVisible()
    await expect(page.getByRole('button', { name: RUN_MODE })).toBeVisible()
  })
})

test.describe('wardrobe', () => {
  const DRESS = /habiller|Dress up|Anziehen|Vestir|Vestire/

  test('separates princesses from knights and shows there is more to scroll', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: DRESS }).first().click()

    await expect(page.getByRole('heading', { name: /Princesses/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Knights|Chevaliers/i })).toBeVisible()

    // A playtest showed a child had no idea the list continued below the fold.
    await expect(page.getByTestId('scroll-more')).toBeVisible()
  })

  test('keeps each kind of item behind its own tab', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: DRESS }).first().click()

    await expect(page.getByRole('button', { name: 'Rosalie' })).toBeVisible()

    await page.getByRole('tab', { name: /my ball|mon ballon/i }).click()
    await expect(page.getByRole('button', { name: 'Rosalie' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /my ball|mon ballon/i })).toBeVisible()

    await page.getByRole('tab', { name: /my pitch|mon terrain/i }).click()
    await expect(page.getByRole('heading', { name: /my pitch|mon terrain/i })).toBeVisible()
  })

  test('can start over, but only after confirming', async ({ page }) => {
    await page.goto('./')
    await page.evaluate(() =>
      localStorage.setItem(
        'royaume-foot:save:v1',
        JSON.stringify({ stars: 25, characterId: 'rosalie', ballId: 'classic', stadiumId: 'prairie', mascotId: 'chat', muted: true }),
      ),
    )
    await page.reload()
    await page.getByRole('button', { name: DRESS }).first().click()
    await page.getByRole('tab', { name: /my friend|mon copain/i }).click()

    await page.getByRole('button', { name: /start over|recommencer/i }).first().click()

    // Backing out must leave the stars alone.
    await page.getByRole('button', { name: /keep them|je les garde/i }).click()
    expect(await savedStars(page)).toBe(25)

    await page.getByRole('button', { name: /start over|recommencer/i }).first().click()
    await page.getByRole('button', { name: /start over|recommencer/i }).last().click()
    await expect.poll(async () => savedStars(page)).toBe(0)
  })
})

async function savedStars(page: Page): Promise<number> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('royaume-foot:save:v1') ?? '{}').stars ?? -1)
}
