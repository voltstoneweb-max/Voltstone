import { test, expect } from '@playwright/test';

const tarjetas = (page) => page.locator('a[aria-label^="Ver "]');

test('el catálogo muestra prendas leídas de la base de datos', async ({ page }) => {
  await page.goto('/#/catalogo');
  await expect(tarjetas(page).first()).toBeVisible({ timeout: 30_000 }); // la API puede tardar si está dormida
  expect(await tarjetas(page).count()).toBeGreaterThan(5);
});

test('el filtro por género (hombre / mujer) funciona', async ({ page }) => {
  for (const g of ['hombre', 'mujer']) {
    await page.goto(`/#/catalogo?genero=${g}`);
    await expect(tarjetas(page).first()).toBeVisible({ timeout: 30_000 });
  }
});

test('la búsqueda ignora tildes ("pantalon" encuentra "Pantalón")', async ({ page }) => {
  await page.goto('/#/catalogo?q=pantalon');
  await expect(tarjetas(page).first()).toBeVisible({ timeout: 30_000 });
  await expect(tarjetas(page).first()).toHaveAttribute('aria-label', /pantal/i);
});

test('una búsqueda sin resultados no rompe la página', async ({ page }) => {
  await page.goto('/#/catalogo?q=zzzzzz-no-existe');
  await expect(page.getByRole('heading').first()).toBeVisible();
  await expect(tarjetas(page)).toHaveCount(0);
});

test('entrar a una prenda muestra su detalle, tallas y botón de agregar', async ({ page }) => {
  await page.goto('/#/catalogo');
  await tarjetas(page).first().click();
  await expect(page).toHaveURL(/#\/producto\//);
  await expect(page.getByRole('group', { name: 'Talla' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Selecciona una talla|Agregar a la bolsa|Agotado|Precio por confirmar/ })).toBeVisible();
});
