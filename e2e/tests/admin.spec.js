import { test, expect } from '@playwright/test';

const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || process.env.TEST_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD };

test('el panel de administración rechaza una clave incorrecta', async ({ page }) => {
  await page.goto('/#/admin');
  await page.getByLabel('Correo').fill('nadie@example.com');
  await page.getByLabel('Clave').fill('clave-incorrecta-123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toContainText(/incorrectos/i);
  await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Pedidos/ })).toHaveCount(0);
});

test.describe('con sesión de administrador', () => {
  test.skip(!ADMIN.email || !ADMIN.password, 'define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD');

  test('entrar, recorrer las pestañas y cerrar sesión', async ({ page }) => {
    await page.goto('/#/admin');
    await page.getByLabel('Correo').fill(ADMIN.email);
    await page.getByLabel('Clave').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    const tabs = page.getByRole('tab');
    await expect(tabs.first()).toBeVisible();
    const n = await tabs.count();
    for (let i = 0; i < n; i++) {
      await tabs.nth(i).click();
      await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
    }
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page.getByLabel('Clave')).toBeVisible();
  });
});
