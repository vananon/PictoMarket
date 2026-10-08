import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

for (const width of [360, 390, 720, 768, 1024, 1440]) {
  test(`interfaz accesible y sin desbordamiento a ${width}px`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page.locator('[data-product-id]')).toHaveCount(10);
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() =>
        page.evaluate(() =>
          Array.from(document.images).every(
            (img) => img.complete && img.naturalWidth > 0,
          ),
        ),
      )
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const overlapping = await page
      .locator('.product-card')
      .evaluateAll((cards) =>
        cards.some((card) => {
          const image = card
            .querySelector('.product-image')!
            .getBoundingClientRect();
          const name = card
            .querySelector('.product-name')!
            .getBoundingClientRect();
          return image.bottom > name.top + 1;
        }),
      );
    expect(overlapping).toBe(false);
    await mkdir('artifacts', { recursive: true });
    await page.screenshot({
      path: `artifacts/market-${width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
    await page.getByRole('button', { name: 'Panel del terapeuta' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
}

test('compra, pistas, exportación, reinicio y otro escenario', async ({
  page,
}) => {
  await page.goto('/');
  const buy = async (id: number) =>
    page.locator(`[data-product-id="${id}"]`).click();
  await buy(2964);
  await buy(2699);
  await buy(2858);
  await expect(page.locator('[data-product-id="2699"]')).toHaveCount(0);
  await expect(page.locator('[data-product-id="8655"]')).toHaveClass(
    /target-hint/,
  );
  await page.getByRole('button', { name: 'Panel del terapeuta' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar sesión JSON' }).click();
  expect((await download).suggestedFilename()).toBe(
    'pictomarket-almuerzo_casa.json',
  );
  await page
    .getByRole('button', { name: 'Cerrar panel del terapeuta' })
    .click();
  for (const id of [8655, 2503, 2594, 2446]) await buy(id);
  await expect(
    page.getByRole('heading', { name: '¡Lo lograste!' }),
  ).toBeVisible();
  await expect(page.locator('.wallet-count')).toHaveText(
    'Tengo 2 de 8 monedas',
  );
  await expect(page.locator('.progress-counter')).toHaveText('4 / 4');
  await page.getByRole('button', { name: 'Otra compra' }).click();
  await expect(page.locator('.objective')).toContainText('DESAYUNO');
  await page.getByRole('button', { name: 'Panel del terapeuta' }).click();
  await page.getByLabel('Escenario de compra').selectOption('1');
  await expect(page.locator('.therapist-stats')).toContainText('0 / 4');
  await page.getByRole('button', { name: 'Reiniciar escenario' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.wallet-count')).toHaveText(
    'Tengo 8 de 8 monedas',
  );
  await expect(page.locator('[data-product-id]')).toHaveCount(10);
});
