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

    // A locked card is deliberately *pressable* — it answers a tap with a sound
    // rather than the silence a child reads as broken — so "locked" can no
    // longer mean `disabled`. What must hold is that pressing it changes
    // nothing: this asserts the behaviour rather than the attribute, and it is
    // the assertion that catches a locked princess actually being selected.
    const freya = page.getByRole('button', { name: /Freya/ })
    await freya.click()
    await expect(freya).toHaveAttribute('aria-pressed', 'false')
    await expect(amara).toHaveAttribute('aria-pressed', 'true')

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

  test('keeps the worn item with the character wearing it, and remembers it', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: DRESS }).first().click()

    // The worn item is a third section of the characters tab, not a sixth tab:
    // six tabs across a 320 px phone are 41 px each, under the 64 px rule.
    await expect(
      page.getByRole('heading', { name: /Ma tenue|My outfit|Mein Outfit|Mi conjunto|Il mio vestito|O meu conjunto/i }),
    ).toBeVisible()
    await expect(page.getByRole('tab')).toHaveCount(5)

    // At zero stars everything but the empty slot is locked, and a locked card
    // stays unselected however hard a six-year-old presses it.
    const wings = page.getByRole('button', { name: /🧚/ })
    await wings.click()
    await expect(wings).toHaveAttribute('aria-pressed', 'false')

    await page.evaluate(() => {
      const raw = localStorage.getItem('royaume-foot:save:v1')
      localStorage.setItem(
        'royaume-foot:save:v1',
        JSON.stringify({ ...(raw ? JSON.parse(raw) : {}), stars: 99 }),
      )
    })
    await page.reload()
    await page.getByRole('button', { name: DRESS }).first().click()

    const unlockedWings = page.getByRole('button', { name: /🧚/ })
    await unlockedWings.click()
    await expect(unlockedWings).toHaveAttribute('aria-pressed', 'true')

    await page.reload()
    await page.getByRole('button', { name: DRESS }).first().click()
    await expect(page.getByRole('button', { name: /🧚/ })).toHaveAttribute('aria-pressed', 'true')
  })

  test('puts the keepers behind their own tab', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: DRESS }).first().click()
    await page.getByRole('tab', { name: /my keeper|mon gardien/i }).click()

    // Braise is free from the first launch, so he is pickable on a fresh save.
    await expect(page.getByRole('button', { name: 'Braise' })).toBeVisible()
    await expect(page.getByRole('heading', { name: /my keeper|mon gardien/i })).toBeVisible()
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
    // Starting over lives at the foot of the LAST tab, deliberately out of a
    // child's casual path through the wardrobe.
    await page.getByRole('tab', { name: /my keeper|mon gardien/i }).click()

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

test.describe('Casse-tour', () => {
  const TOWER_MODE = /casse-tours|smash the towers|türme umwerfen|tira las torres|abbatti le torri|derruba as torres/i

  test('plays a round of towers and always ends in a reward', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('./')
    await page.getByRole('button', { name: TOWER_MODE }).first().click()

    // It counts attempts, like the shooting mode.
    await expect(page.getByTestId('shots')).toBeVisible()

    // A shot that hits nothing runs to SHOT_TIMEOUT (4.5s) and then settles for
    // another 1.9s before the next one is accepted. Swiping faster than that
    // silently drops shots, and the round never ends.
    for (let i = 0; i < 8; i++) {
      await page.mouse.move(195, 700)
      await page.mouse.down()
      await page.mouse.move(195, 430)
      await page.mouse.up()
      await page.waitForTimeout(6800)
    }

    const again = page.getByRole('button', { name: /Encore|Again|Nochmal|Otra vez|Ancora|Outra/ })
    await expect(again).toBeVisible({ timeout: 40_000 })
    // No fail state: even a round that knocks nothing over pays out a star.
    await expect(page.getByText(/⭐/).first()).toBeVisible()
  })
})

test.describe('Coupe du Royaume', () => {
  const CUP_MODE = /coupe du royaume|kingdom cup|königreich-pokal|copa del reino|coppa del regno|taça do reino/i

  test('is offered from the menu and opens on the first leg', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: CUP_MODE }).first().click()

    // The banner is how a child knows this round is part of something longer.
    await expect(page.getByText(/1\/4/)).toBeVisible()
  })

  test('plays all four legs and hands over the trophy', async ({ page }) => {
    // The slow test that earns its place: finishing the cup used to unmount
    // everything and leave a child on a blank page at the moment they had won,
    // because App only rendered PlayScreen for 'play' and 'result'. Nothing
    // short of playing to the end catches that.
    test.setTimeout(420_000)

    await page.goto('./')
    await page.getByRole('button', { name: CUP_MODE }).first().click()
    await expect(page.getByText(/1\/4/)).toBeVisible()

    const trophy = page.getByRole('button', { name: /rejouer|play again/i })
    const deadline = Date.now() + 300_000

    // The legs need different gestures, and the cup rolls straight from one into
    // the next. Rather than script each, do both gestures every time: a swipe
    // that shoots or smashes, and a drag that steers a keeper or a runner.
    //
    // The pause is sized for the SLOWEST leg. A tower shot that hits nothing
    // runs to SHOT_TIMEOUT and then settles, ~6.4s before the next is accepted;
    // swiping faster than that silently drops shots and the cup never ends.
    while (Date.now() < deadline) {
      if (await trophy.isVisible().catch(() => false)) break
      await page.mouse.move(195, 700)
      await page.mouse.down()
      await page.mouse.move(195, 430)
      await page.mouse.up()
      await page.waitForTimeout(500)
      await page.mouse.move(120, 620)
      await page.mouse.down()
      await page.mouse.move(270, 620)
      await page.mouse.up()
      await page.waitForTimeout(6000)
    }

    // The trophy screen itself: the cup is won, and it says so.
    await expect(trophy).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText(/coupe est à toi|cup is yours/i)).toBeVisible()
    await expect(page.getByText(/bonus/i).first()).toBeVisible()
  })
})

test.describe('reduced motion', () => {
  /** Share of pixels that change between two frames a second apart. */
  async function movement(page: Page): Promise<number> {
    const a = 'data:image/png;base64,' + (await page.screenshot()).toString('base64')
    await page.waitForTimeout(900)
    const b = 'data:image/png;base64,' + (await page.screenshot()).toString('base64')
    return page.evaluate(
      ([one, two]) =>
        new Promise<number>((done) => {
          const images = [new Image(), new Image()]
          let loaded = 0
          const compare = () => {
            const canvas = document.createElement('canvas')
            canvas.width = images[0].width
            canvas.height = images[0].height
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(images[0], 0, 0)
            const first = ctx.getImageData(0, 0, canvas.width, canvas.height).data
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(images[1], 0, 0)
            const second = ctx.getImageData(0, 0, canvas.width, canvas.height).data
            let changed = 0
            for (let i = 0; i < first.length; i += 4) {
              const d =
                Math.abs(first[i] - second[i]) +
                Math.abs(first[i + 1] - second[i + 1]) +
                Math.abs(first[i + 2] - second[i + 2])
              if (d > 24) changed++
            }
            done((changed / (first.length / 4)) * 100)
          }
          images.forEach((img, i) => {
            img.onload = () => ++loaded === 2 && compare()
            img.src = i === 0 ? one : two
          })
        }),
      [a, b],
    )
  }

  test('stills the decorative motion, and only the decorative motion', async ({ page }) => {
    test.setTimeout(120_000)

    // src/index.css already honoured this for the DOM animations; the whole 3D
    // half of the game ignored it until Phase 5.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('./')
    await page.waitForTimeout(2500)

    // The menu is pure decoration — a character turning slowly on the spot.
    // Nothing on it should move at all.
    expect(await movement(page)).toBeLessThan(0.1)

    // The pitch keeps the keeper's patrol, because that is the thing the child
    // is timing their shot against. Stilling it would not be a gentler game,
    // it would be a different one.
    await page.getByRole('button', { name: /tirer|shoot/i }).first().click()
    await page.waitForTimeout(2500)
    expect(await movement(page)).toBeGreaterThan(0)
  })

  test('moves by default', async ({ page }) => {
    // The guard on the test above: if the diff always read zero it would pass
    // for the wrong reason.
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('./')
    await page.waitForTimeout(2500)
    expect(await movement(page)).toBeGreaterThan(0.3)
  })
})
