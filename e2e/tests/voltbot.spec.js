import { test, expect } from '@playwright/test';

test('VoltBot: se abre, responde (con IA o con reglas de respaldo) y valida mensajes vacíos', async ({ page }) => {
  await page.goto('/#/');
  await page.getByRole('button', { name: 'Abrir VoltBot' }).click();
  const chat = page.getByLabel('Chat con VoltBot');
  await expect(chat).toBeVisible();

  const enviar = chat.getByRole('button', { name: 'Enviar' });
  await expect(enviar).toBeDisabled(); // no se envían mensajes vacíos

  await chat.getByLabel('Tu pregunta').fill('hola');
  await enviar.click();
  await expect(chat.getByText('hola', { exact: true })).toBeVisible();
  // Sin clave de Gemini (CI) responde el respaldo: "Soy VoltBot..."; con clave, cualquier respuesta
  await expect(chat.locator('p, div, li').filter({ hasText: /VoltBot|VOLTSTONE|prendas|ayudar/i }).first()).toBeVisible({ timeout: 45_000 });
});
