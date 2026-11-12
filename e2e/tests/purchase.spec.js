import { test, expect } from '@playwright/test';
import { API_URL, buyableProduct, registerThroughUI, uniqueEmail } from './helpers.js';

const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || process.env.TEST_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD };

test.describe.serial('compra completa, rastreo y despacho (punto a punto)', () => {
  const email = uniqueEmail('compra');
  let producto;
  let codigo;
  let stockAntes;

  test('1. sin cuenta, "Ir a pagar" pide iniciar sesión; se crea la cuenta y se vuelve al pago', async ({ page, request }) => {
    producto = await buyableProduct(request);
    stockAntes = producto.variants.find((v) => v.size === 'M').stock;

    await page.goto(`/#/producto/${producto._id}`);
    await page.getByRole('group', { name: 'Talla' }).getByRole('button', { name: 'M', exact: true }).click();
    await page.getByRole('button', { name: 'Agregar a la bolsa' }).click();
    await page.getByRole('dialog', { name: 'Bolsa de compras' }).getByRole('button', { name: 'Ir a pagar' }).click();
    await expect(page).toHaveURL(/#\/cuenta\?volver=\/pago/);

    await page.getByRole('tab', { name: /crear cuenta/i }).click();
    await page.getByLabel('Nombre').fill('Cliente E2E');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel(/^Clave/).fill('clave-e2e-12345');
    await page.getByLabel(/Acepto los/).check();
    await page.getByLabel(/Autorizo el tratamiento/).check();
    await page.getByRole('button', { name: 'Crear mi cuenta' }).click();

    await expect(page).toHaveURL(/#\/pago/);
    await expect(page.getByRole('heading', { name: 'Pago' })).toBeVisible();
  });

  test('2. el formulario de pago valida y luego confirma el pedido', async ({ page, request }) => {
    // Nueva página = sesión nueva: se inicia sesión con la cuenta creada en el paso anterior
    await page.goto('/#/cuenta');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel(/^Clave/).fill('clave-e2e-12345');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toBeVisible();

    await page.goto(`/#/producto/${producto._id}`);
    await page.getByRole('group', { name: 'Talla' }).getByRole('button', { name: 'M', exact: true }).click();
    await page.getByRole('button', { name: 'Agregar a la bolsa' }).click();
    await page.getByRole('dialog', { name: 'Bolsa de compras' }).getByRole('button', { name: 'Ir a pagar' }).click();
    await expect(page).toHaveURL(/#\/pago/);

    // Enviar vacío: no se crea el pedido y se muestra un mensaje
    await page.getByRole('button', { name: 'Confirmar pedido' }).click();
    await expect(page).toHaveURL(/#\/pago/);
    await expect(page.getByRole('alert').or(page.locator('.alert-error')).first()).toBeVisible();

    await page.getByLabel('Teléfono').fill('3001234567');
    const cali = await page.getByLabel('Ciudad').locator('option', { hasText: 'Cali' }).first().getAttribute('value');
    await page.getByLabel('Ciudad').selectOption(cali);
    await page.getByLabel('Dirección', { exact: true }).fill('Calle 5 # 38-20, apto 301');
    await page.getByLabel('PSE').check();
    await page.getByLabel(/Acepto los/).check();
    await page.getByRole('button', { name: 'Confirmar pedido' }).click();

    await expect(page.getByRole('heading', { name: '¡Gracias por tu compra!' })).toBeVisible({ timeout: 30_000 });
    codigo = (await page.locator('.case-box strong').innerText()).trim();
    expect(codigo).toMatch(/^VOLT-\d+$/);
    await expect(page.getByText('Pago confirmado').first()).toBeVisible();
    await expect(page.getByText(/\$10\.000/)).toBeVisible(); // envío fijo en el recibo
  });

  test('3. la base de datos descontó el stock de la talla comprada', async ({ request }) => {
    const res = await request.get(`${API_URL}/products/${producto._id}`);
    const ahora = (await res.json()).variants.find((v) => v.size === 'M').stock;
    expect(ahora).toBe(stockAntes - 1);
  });

  test('4. rastreo público con número + correo muestra el estado', async ({ page }) => {
    await page.goto('/#/rastreo');
    await page.getByLabel('Números del pedido').fill(codigo.replace('VOLT-', ''));
    await page.getByLabel('Correo del pedido').fill(email);
    await page.getByRole('button', { name: /Rastrear pedido/ }).click();
    await expect(page.getByRole('heading', { name: codigo })).toBeVisible();
    await expect(page.getByText('Pago confirmado').first()).toBeVisible();
  });

  test('5. con un correo equivocado el rastreo no muestra el pedido', async ({ page }) => {
    await page.goto('/#/rastreo');
    await page.getByLabel('Números del pedido').fill(codigo.replace('VOLT-', ''));
    await page.getByLabel('Correo del pedido').fill('otra-persona@example.com');
    await page.getByRole('button', { name: /Rastrear pedido/ }).click();
    await expect(page.getByRole('heading', { name: codigo })).toHaveCount(0);
    await expect(page.getByRole('alert').or(page.locator('.alert-error')).first()).toBeVisible();
  });

  test('6. el administrador cambia el estado y el cliente lo ve; al cancelar, el stock vuelve', async ({ page, browser }) => {
    test.skip(!ADMIN.email || !ADMIN.password, 'define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD');

    const ctxAdmin = await browser.newContext();
    const admin = await ctxAdmin.newPage();
    await admin.goto('/#/admin');
    await admin.getByLabel('Correo').fill(ADMIN.email);
    await admin.getByLabel('Clave').fill(ADMIN.password);
    await admin.getByRole('button', { name: 'Entrar' }).click();
    await expect(admin.getByRole('heading', { name: 'Panel de administración' })).toBeVisible();
    await admin.getByRole('tab', { name: /Pedidos/ }).click();

    const estado = admin.getByLabel(`Estado de ${codigo}`);
    await expect(estado).toBeVisible();
    await estado.selectOption('En preparación');
    await expect(estado).toHaveValue('En preparación');

    // El cliente (rastreo público) ve el cambio
    await page.goto('/#/rastreo');
    await page.getByLabel('Números del pedido').fill(codigo.replace('VOLT-', ''));
    await page.getByLabel('Correo del pedido').fill(email);
    await page.getByRole('button', { name: /Rastrear pedido/ }).click();
    await expect(page.getByText('En preparación').first()).toBeVisible();

    // Cancelar repone el stock
    await estado.selectOption('Cancelado');
    await expect(estado).toBeDisabled();
    await expect.poll(async () => {
      const res = await page.request.get(`${API_URL}/products/${producto._id}`);
      return (await res.json()).variants.find((v) => v.size === 'M').stock;
    }).toBe(stockAntes);
    await ctxAdmin.close();
  });
});
