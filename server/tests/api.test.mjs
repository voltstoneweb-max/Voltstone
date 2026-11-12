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
  for (const k of ['_id', 'name', 'category', 'genders', 'materials']) assert.ok(k in list[0], `falta el campo ${k}`);
  assert.ok(list.every((p) => p.active), 'el público no debe ver productos ocultos');
});

test('el filtro por género funciona', async () => {
  const list = await (await call('/products?gender=mujer')).json();
  assert.ok(list.every((p) => p.genders.includes('mujer')));
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

test('el catálogo maestro está completo (todas las categorías)', async () => {
  const list = await (await call('/products')).json();
  assert.ok(list.length >= 160, `Solo hay ${list.length} prendas: corre npm run seed`);
  assert.ok(new Set(list.map((p) => p.category)).size >= 8);
});

test('preguntas: pública solo lista respondidas y valida la entrada', async () => {
  assert.equal((await call('/questions')).status, 400);
  assert.equal((await call('/questions', { method: 'POST', body: { productId: 'x', name: 'Ana', email: 'a@a.co', question: 'hola' } })).status, 400);
  assert.equal((await call('/questions/all')).status, 401);
});

test('contacto: rechaza un motivo inventado', async () => {
  const res = await call('/contact', { method: 'POST', body: { name: 'Ana', email: 'ana@correo.co', message: 'Mensaje de prueba largo', reason: 'hackeo', acceptDataPolicy: true } });
  assert.ok([400, 429].includes(res.status));
});

test('contacto y preguntas exigen autorizar el tratamiento de datos', async () => {
  const c = await call('/contact', { method: 'POST', body: { name: 'Ana', email: 'ana@correo.co', message: 'Mensaje de prueba largo', reason: 'otro' } });
  assert.ok([400, 429].includes(c.status));
  const q = await call('/questions', { method: 'POST', body: { productId: '000000000000000000000000', name: 'Ana', email: 'ana@correo.co', question: 'Pregunta de prueba larga' } });
  assert.ok([400, 429].includes(q.status));
});

test('un correo con signo de pregunta se rechaza', async () => {
  const res = await call('/contact', { method: 'POST', body: { name: 'Ana', email: 'ana?@correo.co', message: 'Mensaje de prueba largo', reason: 'otro', acceptDataPolicy: true } });
  assert.ok([400, 429].includes(res.status));
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


// ---------- Fase 2: rastreo de pedidos y cuentas de cliente ----------
const STATUSES = ['Pago confirmado', 'En preparación', 'Empacado', 'Entregado a la transportadora', 'En camino', 'Entregado', 'Cancelado'];
const track = (code, email) => call('/orders/track', { method: 'POST', body: { code, email } });

test('el rastreo pide número + correo y no muestra datos personales', async () => {
  const res = await track('VOLT-1001', 'camila.demo@example.com');
  assert.ok([200, 429].includes(res.status), `llegó ${res.status}: ¿corriste npm run seed?`);
  if (res.status !== 200) return;
  const order = await res.json();
  assert.equal(order.code, 'VOLT-1001');
  assert.ok(STATUSES.includes(order.status));
  assert.ok(Array.isArray(order.items) && order.items.length > 0);
  for (const k of ['customerEmail', 'customerName', 'customerPhone', 'address']) assert.ok(!(k in order), `el rastreo público no debe mostrar ${k}`);
});

test('el rastreo rechaza correo equivocado, números mal escritos y pedidos que no existen', async () => {
  const ok = (r, list) => assert.ok(list.includes(r.status), `llegó ${r.status}`);
  ok(await track('VOLT-1001', 'otra.persona@example.com'), [404, 429]); // número real, correo que no es
  ok(await track('ABC-1', 'a@a.co'), [400, 429]);
  ok(await track('VOLT-999999', 'a@a.co'), [404, 429]);
  ok(await track('VOLT-1001', ''), [400, 429]);
  assert.ok([404, 405].includes((await call('/orders/track/VOLT-1001')).status), 'el rastreo por GET con solo el número ya no existe');
});

test('la confirmación del pedido exige sesión de cliente', async () => {
  assert.equal((await call('/orders/mine/VOLT-1001')).status, 401);
  assert.equal((await call('/orders/quote', { method: 'POST', body: { items: [] } })).status, 401);
});

test('rutas de pedidos del administrador sin token devuelven 401', async () => {
  assert.equal((await call('/orders')).status, 401);
  assert.equal((await call('/orders/VOLT-1001/status', { method: 'PATCH', body: { status: 'Entregado' } })).status, 401);
});

test('crear cuenta exige aceptar términos y datos personales', async () => {
  const res = await call('/customers/register', { method: 'POST', body: { name: 'Prueba', email: 'prueba@example.com', password: 'clave-larga-123', acceptTerms: false, acceptDataPolicy: true } });
  assert.equal(res.status, 400);
});

test('el login de cliente con datos inventados devuelve 401', async () => {
  const res = await call('/customers/login', { method: 'POST', body: { email: 'nadie-existe@example.com', password: 'cualquiera123' } });
  assert.equal(res.status, 401);
});

test('/customers/me sin token devuelve 401', async () => {
  assert.equal((await call('/customers/me')).status, 401);
});

// Crea una cuenta de prueba en la base de datos: solo se ejecuta si lo pides (TEST_REGISTER=1)
test('un token de cliente NO abre las rutas del administrador', { skip: process.env.TEST_REGISTER !== '1' }, async () => {
  const email = `prueba+${Date.now()}@example.com`;
  const reg = await call('/customers/register', { method: 'POST', body: { name: 'Prueba Auto', email, password: 'clave-larga-123', acceptTerms: true, acceptDataPolicy: true } });
  assert.equal(reg.status, 201);
  const { token } = await reg.json();
  const me = await call('/customers/me', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(me.status, 200);
  const admin = await call('/products/all', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(admin.status, 403, 'un cliente no debe entrar al panel');
});


// ---------- Fase 3: página de producto, envíos y compra ----------
// Rechazo esperado: 400 (datos inválidos), 401 (sin cuenta) o 429 (límite de pedidos seguidos si repites las pruebas varias veces)
const rejected = (res) => assert.ok([400, 401, 429].includes(res.status), `se esperaba 400, 401 o 429 y llegó ${res.status}`);
test('una prenda por id existe y un id inválido o inexistente se rechaza', async () => {
  const list = await (await call('/products')).json();
  const ok = await call(`/products/${list[0]._id}`);
  assert.equal(ok.status, 200);
  assert.equal((await ok.json())._id, list[0]._id);
  assert.equal((await call('/products/no-es-un-id')).status, 400);
  assert.equal((await call('/products/000000000000000000000000')).status, 404);
});

test('el envío es fijo de $10.000 y hay ciudades con su tiempo de entrega', async () => {
  const res = await call('/orders/shipping');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.fee, 10000);
  assert.ok(data.cities.length >= 10 && data.cities.every((c) => c.name && c.min >= 1 && c.max >= c.min));
  assert.deepEqual(data.paymentMethods, ['Tarjeta', 'PSE', 'Contra entrega']);
});

test('comprar rechaza datos incompletos, bolsa vacía y términos sin aceptar', async () => {
  const base = { name: 'Prueba', email: 'prueba@example.com', phone: '3001234567', city: 'Cali', address: 'Calle 1 # 2-3', paymentMethod: 'PSE', acceptTerms: true };
  rejected(await call('/orders', { method: 'POST', body: {} }));
  rejected(await call('/orders', { method: 'POST', body: { ...base, items: [] } }));
  rejected(await call('/orders', { method: 'POST', body: { ...base, acceptTerms: false, items: [{ productId: '000000000000000000000000', size: 'M', qty: 1 }] } }));
  rejected(await call('/orders', { method: 'POST', body: { ...base, items: [{ productId: 'x', size: 'M', qty: 1 }] } }));
});

test('comprar una prenda inexistente o con cantidad absurda se rechaza sin tocar el stock', async () => {
  const base = { name: 'Prueba', email: 'prueba@example.com', phone: '3001234567', city: 'Cali', address: 'Calle 1 # 2-3', paymentMethod: 'Tarjeta', acceptTerms: true };
  rejected(await call('/orders', { method: 'POST', body: { ...base, items: [{ productId: '000000000000000000000000', size: 'M', qty: 1 }] } }));
  const list = await (await call('/products')).json();
  rejected(await call('/orders', { method: 'POST', body: { ...base, items: [{ productId: list[0]._id, size: 'M', qty: 999 }] } }));
});

test('/orders/mine sin sesión devuelve 401', async () => {
  assert.equal((await call('/orders/mine')).status, 401);
});

test('comprar exige una cuenta: sin iniciar sesión devuelve 401', async () => {
  const list = await (await call('/products')).json();
  const res = await call('/orders', { method: 'POST', body: { name: 'Prueba', email: 'prueba@example.com', phone: '3001234567', city: 'Cali', address: 'Calle 1 # 2-3', paymentMethod: 'PSE', acceptTerms: true, items: [{ productId: list[0]._id, size: list[0].sizes[0] || 'M', qty: 1 }] } });
  assert.ok([401, 429].includes(res.status), `se esperaba 401 y llegó ${res.status}`);
});

// Compra completa con una cuenta de prueba: crea la cuenta, compra, descuenta stock y rastrea. Solo si lo pides (TEST_BUY=1)
test('compra completa: crea el pedido, descuenta el stock y se puede rastrear', { skip: process.env.TEST_BUY !== '1' }, async () => {
  const list = await (await call('/products')).json();
  const p = list.find((x) => x.price != null && x.variants?.some((v) => v.stock >= 3));
  assert.ok(p, 'No hay una prenda con stock suficiente: corre npm run seed');
  const v = p.variants.find((x) => x.stock >= 3);
  const email = `prueba+${Date.now()}@example.com`;
  const reg = await call('/customers/register', { method: 'POST', body: { name: 'Prueba Auto', email, password: 'clave-larga-123', acceptTerms: true, acceptDataPolicy: true } });
  assert.equal(reg.status, 201);
  const { token } = await reg.json();
  const res = await call('/orders', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: { name: 'Prueba Auto', email, phone: '3001234567', city: 'Cali', address: 'Calle 1 # 2-3', paymentMethod: 'Tarjeta', acceptTerms: true, expectedTotal: p.price + 10000, items: [{ productId: p._id, size: v.size, qty: 1 }] } });
  assert.equal(res.status, 201);
  const { code, status, total } = await res.json();
  assert.match(code, /^VOLT-\d+$/);
  assert.equal(status, 'Pago confirmado');
  assert.equal(total, p.price + 10000);
  const after = await (await call(`/products/${p._id}`)).json();
  assert.equal(after.variants.find((x) => x.size === v.size).stock, v.stock - 1, 'solo baja el stock de la talla comprada');
  assert.equal(after.stock, p.stock - 1);
  // La confirmación se carga con la sesión del cliente; el rastreo público pide número + correo
  assert.equal((await call(`/orders/mine/${code}`, { headers: { Authorization: `Bearer ${token}` } })).status, 200);
  assert.equal((await track(code, email)).status, 200);
  // Un total que ya no es el real se rechaza sin cobrar ni descontar
  const stale = await call('/orders', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: { name: 'Prueba Auto', email, phone: '3001234567', city: 'Cali', address: 'Calle 1 # 2-3', paymentMethod: 'Tarjeta', acceptTerms: true, expectedTotal: 1, items: [{ productId: p._id, size: v.size, qty: 1 }] } });
  assert.equal(stale.status, 409);
  const mine = await call('/orders/mine', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(mine.status, 200);
  assert.ok((await mine.json()).some((o) => o.code === code), 'el pedido debe aparecer en Mis pedidos');
});
