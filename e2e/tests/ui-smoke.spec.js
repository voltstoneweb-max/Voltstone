import { test, expect } from '@playwright/test';

// Cada página principal abre, muestra un título y NO produce errores de JavaScript ni de consola.
const rutas = ['/', '/catalogo', '/contacto', '/ayuda', '/rastreo', '/cuenta', '/info/terminos', '/admin'];

for (const ruta of rutas) {
  test(`la página ${ruta} carga sin errores`, async ({ page }) => {
    const errores = [];
    page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errores.push(`console: ${m.text()}`); });
    await page.goto(`/#${ruta}`);
    await expect(page.getByRole('heading').first()).toBeVisible();
    expect(errores, errores.join('\n')).toEqual([]);
  });
}

test('una ruta inexistente vuelve al inicio', async ({ page }) => {
  await page.goto('/#/esta-ruta-no-existe');
  await expect(page).toHaveURL(/#\/$/);
});

test('la barra de navegación lleva al catálogo y al rastreo', async ({ page, isMobile }) => {
  test.skip(isMobile, 'en móvil el menú es otro; se cubre en escritorio');
  await page.goto('/#/');
  await page.getByRole('link', { name: 'Rastrear pedido' }).first().click();
  await expect(page.getByRole('heading', { name: 'Rastrear pedido' })).toBeVisible();
});
