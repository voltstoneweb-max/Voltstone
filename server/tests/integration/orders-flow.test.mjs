/**
 * Integración: compra completa, stock, cancelación, permisos y carrera por la última unidad.
 * Requiere: servidor + MongoDB con el seed, y TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD.
 * Estas pruebas MODIFICAN stock y crean pedidos: solo corren con TEST_BUY=1 (en CI ya está activo).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const API = process.env.API_URL || 'http://localhost:4000/api';
const ADMIN = { email: process.env.TEST_ADMIN_EMAIL, password: process.env.TEST_ADMIN_PASSWORD };
const enabled = process.env.TEST_BUY === '1' && ADMIN.email && ADMIN.password;
const opts = { skip: !enabled && 'define TEST_BUY=1, TEST_ADMIN_EMAIL y TEST_ADMIN_PASSWORD' };

const call = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};

const uid = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
const register = async (tag) => {
  const email = `itest-${tag}-${uid}@example.com`;
  const { status, data } = await call('/customers/register', { method: 'POST', body: { name: `Cliente ${tag}`, email, password: 'clave-de-prueba-1', acceptTerms: true, acceptDataPolicy: true } });
  assert.equal(status, 201, JSON.stringify(data));
  return { email, token: data.token };
};
const checkout = (items, email, extra = {}) => ({
  name: 'Cliente Prueba', email, phone: '3001234567', city: 'Cali', address: 'Calle 1 # 2-34', paymentMethod: 'Tarjeta', acceptTerms: true, items, ...extra
});
const stockOf = async (id, size) => (await call(`/products/${id}`)).data.variants.find((v) => v.size === size).stock;

let admin, buyer, other, productA, productB;

test('preparación: catálogo, cuentas y sesión de administrador', opts, async () => {
  const { data: products } = await call('/products');
  const buyable = products.filter((p) => p.price != null && p.variants.some((v) => v.size === 'XL' && v.stock >= 3) && p.variants.some((v) => v.size === 'M' && v.stock >= 5));
  assert.ok(buyable.length >= 2, 'el seed debe dejar al menos 2 prendas comprables');
  [productA, productB] = [buyable[10], buyable[11] || buyable[1]]; // lejos de las que usan otras pruebas
  buyer = await register('comprador');
  other = await register('otro');
  const login = await call('/auth/login', { method: 'POST', body: ADMIN });
  assert.equal(login.status, 200, 'login de administrador');
  admin = login.data.token;
});

test('cotizar: el total real = precio de la base × cantidad + envío $10.000', opts, async () => {
  const { status, data } = await call('/orders/quote', { method: 'POST', token: buyer.token, body: { items: [{ productId: productA._id, size: 'M', qty: 2 }] } });
  assert.equal(status, 200);
  assert.equal(data.subtotal, productA.price * 2);
  assert.equal(data.shipping, 10000);
  assert.equal(data.total, productA.price * 2 + 10000);
});

test('el precio que manda el navegador se IGNORA (no se puede comprar más barato)', opts, async () => {
  const { data } = await call('/orders/quote', { method: 'POST', token: buyer.token, body: { items: [{ productId: productA._id, size: 'M', qty: 1, price: 1, name: 'x' }] } });
  assert.equal(data.items[0].price, productA.price);
});

test('compra: crea el pedido, descuenta el stock de ESA talla y no toca las otras', opts, async () => {
  const before = { M: await stockOf(productA._id, 'M'), L: await stockOf(productA._id, 'L') };
  const { status, data } = await call('/orders', { method: 'POST', token: buyer.token, body: checkout([{ productId: productA._id, size: 'M', qty: 2 }], buyer.email, { expectedTotal: productA.price * 2 + 10000 }) });
  assert.equal(status, 201, JSON.stringify(data));
  assert.match(data.code, /^VOLT-\d+$/);
  assert.equal(data.status, 'Pago confirmado');
  assert.equal(data.total, productA.price * 2 + 10000);
  assert.equal(await stockOf(productA._id, 'M'), before.M - 2);
  assert.equal(await stockOf(productA._id, 'L'), before.L);
  buyer.code = data.code;
});

test('si el total esperado ya no coincide con el real, no se cobra (409) y el stock no cambia', opts, async () => {
  const before = await stockOf(productA._id, 'M');
  const { status } = await call('/orders', { method: 'POST', token: buyer.token, body: checkout([{ productId: productA._id, size: 'M', qty: 1 }], buyer.email, { expectedTotal: 5 }) });
  assert.equal(status, 409);
  assert.equal(await stockOf(productA._id, 'M'), before);
});

test('rastreo: con número + correo correctos funciona; con otro correo da 404 genérico', opts, async () => {
  const ok = await call('/orders/track', { method: 'POST', body: { code: buyer.code, email: buyer.email } });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.code, buyer.code);
  assert.equal(ok.data.customerEmail, undefined, 'el rastreo público no debe exponer datos personales');
  assert.equal(ok.data.customerPhone, undefined);
  const bad = await call('/orders/track', { method: 'POST', body: { code: buyer.code, email: 'otra@example.com' } });
  assert.equal(bad.status, 404);
});

test('permisos: el cliente ve SU pedido, otro cliente no, y ninguno entra al panel', opts, async () => {
  assert.equal((await call(`/orders/mine/${buyer.code}`, { token: buyer.token })).status, 200);
  assert.equal((await call(`/orders/mine/${buyer.code}`, { token: other.token })).status, 404);
  assert.equal((await call('/orders', { token: buyer.token })).status, 403);
  assert.equal((await call('/orders')).status, 401);
  assert.equal((await call(`/orders/${buyer.code}/status`, { method: 'PATCH', token: buyer.token, body: { status: 'Cancelado' } })).status, 403);
});

test('comprar sin sesión da 401', opts, async () => {
  assert.equal((await call('/orders', { method: 'POST', body: checkout([{ productId: productA._id, size: 'M', qty: 1 }], 'a@b.co') })).status, 401);
});

test('entradas inválidas: cantidad 0, 11, decimal, talla inexistente, id falso', opts, async () => {
  const buy = (item) => call('/orders', { method: 'POST', token: buyer.token, body: checkout([item], buyer.email) });
  assert.equal((await buy({ productId: productA._id, size: 'M', qty: 0 })).status, 400);
  assert.equal((await buy({ productId: productA._id, size: 'M', qty: 11 })).status, 400);
  assert.equal((await buy({ productId: productA._id, size: 'M', qty: 1.5 })).status, 400);
  assert.equal((await buy({ productId: productA._id, size: 'XXXL', qty: 1 })).status, 409);
  assert.equal((await buy({ productId: 'no-es-un-id', size: 'M', qty: 1 })).status, 400);
});

test('administrador: los estados solo avanzan; no se retrocede', opts, async () => {
  const patch = (status) => call(`/orders/${buyer.code}/status`, { method: 'PATCH', token: admin, body: { status } });
  assert.equal((await patch('En preparación')).status, 200);
  assert.equal((await patch('Pago confirmado')).status, 409);
  assert.equal((await patch('Estado inventado')).status, 400);
  assert.equal((await patch('Empacado')).status, 200);
  const seen = await call('/orders/track', { method: 'POST', body: { code: buyer.code, email: buyer.email } });
  assert.equal(seen.data.status, 'Empacado');
  assert.ok(seen.data.history.length >= 3, 'el historial registra cada cambio');
});

test('después del despacho ya no se puede cancelar', opts, async () => {
  assert.equal((await call(`/orders/${buyer.code}/status`, { method: 'PATCH', token: admin, body: { status: 'Entregado a la transportadora' } })).status, 200);
  assert.equal((await call(`/orders/${buyer.code}/status`, { method: 'PATCH', token: admin, body: { status: 'Cancelado' } })).status, 409);
});

test('cancelar repone el stock UNA sola vez (aunque se pida dos veces o a la vez)', opts, async () => {
  const before = await stockOf(productB._id, 'M');
  const bought = await call('/orders', { method: 'POST', token: buyer.token, body: checkout([{ productId: productB._id, size: 'M', qty: 3 }], buyer.email) });
  assert.equal(bought.status, 201);
  assert.equal(await stockOf(productB._id, 'M'), before - 3);

  const cancel = () => call(`/orders/${bought.data.code}/status`, { method: 'PATCH', token: admin, body: { status: 'Cancelado' } });
  const results = await Promise.all([cancel(), cancel(), cancel()]);
  assert.equal(results.filter((r) => r.status === 200).length, 1, 'solo una cancelación gana');
  assert.equal(await stockOf(productB._id, 'M'), before, 'el stock vuelve exacto, sin duplicarse');
  assert.equal((await cancel()).status, 409, 'un pedido cancelado ya no se cambia');
});

test('carrera: varias compras a la vez de la última unidad -> nunca se vende de más', opts, async () => {
  const stock = await stockOf(productB._id, 'XL');
  assert.ok(stock >= 1);
  const attempts = stock + 3;
  const results = await Promise.all(Array.from({ length: attempts }, () =>
    call('/orders', { method: 'POST', token: buyer.token, body: checkout([{ productId: productB._id, size: 'XL', qty: 1 }], buyer.email) })));
  const ok = results.filter((r) => r.status === 201).length;
  const rejected = results.filter((r) => r.status === 409).length;
  assert.equal(ok, stock, `deben salir exactamente ${stock} pedidos`);
  assert.equal(ok + rejected, attempts, 'el resto se rechaza con 409, sin errores 500');
  assert.equal(await stockOf(productB._id, 'XL'), 0, 'el stock queda en 0, nunca negativo');
  const codes = results.filter((r) => r.status === 201).map((r) => r.data.code);
  assert.equal(new Set(codes).size, codes.length, 'los números de pedido no se repiten');
});

test('un producto oculto no se puede comprar y desaparece del catálogo público', opts, async () => {
  const hide = (active) => call(`/products/${productA._id}`, { method: 'PUT', token: admin, body: { active } });
  assert.equal((await hide(false)).status, 200);
  const buy = await call('/orders', { method: 'POST', token: buyer.token, body: checkout([{ productId: productA._id, size: 'L', qty: 1 }], buyer.email) });
  assert.equal(buy.status, 409);
  assert.equal((await call(`/products/${productA._id}`)).status, 404);
  assert.equal((await hide(true)).status, 200);
});
