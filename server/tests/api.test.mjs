/**
 * Pruebas automáticas de la API (sin librerías: usa node:test de Node 20).
 * Requisito: el servidor debe estar corriendo (npm run dev:server).
 *
 * Uso local:      npm test
 * Contra Render:  $env:API_URL="https://TU-SERVICIO.onrender.com/api"; npm test
 * Con login real: $env:TEST_ADMIN_EMAIL="..."; $env:TEST_ADMIN_PASSWORD="..."; npm test
 *
 * Ojo: los límites de intentos cuentan estas peticiones; si repites muchas veces seguidas verás 429.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const API = process.env.API_URL || 'http://localhost:4000/api';
const call = (path, { method = 'GET', body, headers = {} } = {}) =>
  fetch(`${API}${path}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined });

test('el servidor responde (health)', async () => {
  const res = await call('/health').catch(() => null);
  assert.ok(res, 'No hay servidor. Arranca con: npm run dev:server (o revisa API_URL)');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test('catálogo público devuelve una lista de productos con campos esperados', async () => {
  const res = await call('/products');
  assert.equal(res.status, 200);
  const list = await res.json();
  assert.ok(Array.isArray(list) && list.length > 0, 'Catálogo vacío: ¿corriste npm run seed?');
  for (const k of ['_id', 'name', 'price', 'sizes', 'stock']) assert.ok(k in list[0], `falta el campo ${k}`);
  assert.ok(list.every((p) => p.active), 'el público no debe ver productos ocultos');
});

test('el filtro por género funciona', async () => {
  const list = await (await call('/products?gender=mujer')).json();
  assert.ok(list.every((p) => p.gender === 'mujer'));
});

test('rutas de admin sin token devuelven 401', async () => {
  for (const [method, path] of [['GET', '/products/all'], ['GET', '/contact'], ['POST', '/products'], ['DELETE', '/products/x'], ['POST', '/ai/generate-text']]) {
    const res = await call(path, { method, body: method === 'POST' ? {} : undefined });
    assert.equal(res.status, 401, `${method} ${path} debería exigir login`);
  }
});

test('un token falso o manipulado es rechazado', async () => {
  const fake = 'eyJhbGciOiJub25lIn0.eyJlbWFpbCI6ImFAYS5jbyJ9.';
  const res = await call('/products/all', { headers: { Authorization: `Bearer ${fake}` } });
  assert.equal(res.status, 401);
});

test('login con clave incorrecta da 401 y mensaje genérico', async () => {
  const res = await call('/auth/login', { method: 'POST', body: { email: 'nadie@voltstone.co', password: 'incorrecta123' } });
  assert.ok([401, 429].includes(res.status));
  if (res.status === 401) assert.match((await res.json()).error.message, /incorrectos/);
});

test('contacto rechaza campos vacíos y correos inválidos', async () => {
  const empty = await call('/contact', { method: 'POST', body: {} });
  assert.ok([400, 429].includes(empty.status));
  const badMail = await call('/contact', { method: 'POST', body: { name: 'Ana', email: 'no-es-correo', subject: 'Hola', message: 'Mensaje de prueba largo' } });
  assert.ok([400, 429].includes(badMail.status));
});

test('chat de IA valida la entrada', async () => {
  assert.equal((await call('/ai/chat', { method: 'POST', body: { message: '' } })).status, 400);
  assert.equal((await call('/ai/chat', { method: 'POST', body: { message: 'x'.repeat(501) } })).status, 400);
});

test('una ruta inexistente devuelve JSON 404 (no una página de error)', async () => {
  const res = await call('/no-existe');
  assert.equal(res.status, 404);
  assert.ok((await res.json()).error.message);
});

test('CORS: un origen desconocido NO recibe permiso', async () => {
  const res = await call('/products', { headers: { Origin: 'https://sitio-malicioso.example' } });
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});

test('encabezados de seguridad de helmet presentes', async () => {
  const res = await call('/health');
  assert.ok(res.headers.get('x-content-type-options'));
});

const { TEST_ADMIN_EMAIL: email, TEST_ADMIN_PASSWORD: password } = process.env;
test('login real + panel + cierre (solo si defines TEST_ADMIN_*)', { skip: !(email && password) }, async () => {
  const login = await call('/auth/login', { method: 'POST', body: { email, password } });
  assert.equal(login.status, 200);
  const { token } = await login.json();
  const res = await call('/products/all', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(await res.json()));
});
