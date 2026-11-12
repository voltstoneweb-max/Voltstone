export const API_URL = process.env.API_URL || 'http://localhost:4000/api';

/** Una prenda comprable (con precio y stock suficiente en la talla M), leída de la API real. */
export async function buyableProduct(request, size = 'M', minStock = 4) {
  const res = await request.get(`${API_URL}/products`);
  if (!res.ok()) throw new Error(`La API no responde (${res.status()}). ¿Está corriendo con el seed cargado?`);
  const products = await res.json();
  const p = products.find((x) => x.price != null && x.variants?.some((v) => v.size === size && v.stock >= minStock));
  if (!p) throw new Error('No hay ninguna prenda comprable en el catálogo.');
  return p;
}

export const uniqueEmail = (tag = 'e2e') => `${tag}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.com`;

/** Crea una cuenta desde la pantalla "Crear cuenta" (clic en cada campo, como lo haría una persona). */
export async function registerThroughUI(page, { name = 'Cliente E2E', email, password = 'clave-e2e-12345', from = '/cuenta' }) {
  await page.goto(`/#${from}`);
  await page.getByRole('tab', { name: /crear cuenta/i }).click();
  await page.getByLabel('Nombre').fill(name);
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel(/^Clave/).fill(password);
  await page.getByLabel(/Acepto los/).check();
  await page.getByLabel(/Autorizo el tratamiento/).check();
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
}
