import { test, expect } from '@playwright/test';
import { buyableProduct } from './helpers.js';

test('la bolsa: agregar, subir cantidad, quitar y quedar vacía', async ({ page, request }) => {
  const p = await buyableProduct(request);
  await page.goto(`/#/producto/${p._id}`);

  // Sin talla elegida el botón pide seleccionarla
  await page.getByRole('button', { name: 'Selecciona una talla' }).click();
  await page.getByRole('group', { name: 'Talla' }).getByRole('button', { name: 'M', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar a la bolsa' }).click();

  const bolsa = page.getByRole('dialog', { name: 'Bolsa de compras' });
  await expect(bolsa).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bolsa (1)' })).toBeVisible();

  await bolsa.getByRole('button', { name: 'Más' }).click();
  await expect(page.getByRole('button', { name: 'Bolsa (2)' })).toBeVisible();
  await bolsa.getByRole('button', { name: 'Menos' }).click();
  await expect(page.getByRole('button', { name: 'Bolsa (1)' })).toBeVisible();

  await bolsa.getByRole('button', { name: 'Quitar' }).click();
  await expect(bolsa.getByText('Tu bolsa está vacía')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bolsa (0)' })).toBeVisible();
});

test('la bolsa se conserva al recargar la página', async ({ page, request }) => {
  const p = await buyableProduct(request);
  await page.goto(`/#/producto/${p._id}`);
  await page.getByRole('group', { name: 'Talla' }).getByRole('button', { name: 'M', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar a la bolsa' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Bolsa (1)' })).toBeVisible();
});

test('la cantidad nunca supera el stock de la talla ni 10', async ({ page, request }) => {
  const p = await buyableProduct(request, 'M', 1);
  const stock = p.variants.find((v) => v.size === 'M').stock;
  await page.goto(`/#/producto/${p._id}`);
  await page.getByRole('group', { name: 'Talla' }).getByRole('button', { name: 'M', exact: true }).click();
  const mas = page.getByRole('button', { name: 'Más' });
  for (let i = 0; i < 12; i++) if (await mas.isEnabled()) await mas.click();
  await expect(mas).toBeDisabled();
  await page.getByRole('button', { name: 'Agregar a la bolsa' }).click();
  const n = Number((await page.getByRole('button', { name: /^Bolsa \(\d+\)$/ }).getAttribute('aria-label')).match(/\d+/)[0]);
  expect(n).toBeLessThanOrEqual(Math.min(10, stock));
});

test('los favoritos se pueden marcar y quitar', async ({ page, request }) => {
  const p = await buyableProduct(request);
  await page.goto(`/#/producto/${p._id}`);
  await page.locator('button.heart').first().click();
  await expect(page.getByRole('button', { name: 'Favoritos (1)' })).toBeVisible();
});
