import test from 'node:test';
import assert from 'node:assert/strict';
import Product, { parseVariants } from '../../src/models/Product.js';
import Order, { ORDER_STATUSES, FLOW, CANCELABLE } from '../../src/models/Order.js';

const base = { name: 'Camiseta', category: 'Ropa superior', variants: [{ size: 'M', stock: 5 }], price: 89900 };
const errs = (doc) => doc.validateSync()?.errors || {};

test('parseVariants: texto "S:6, M:10"', () => {
  assert.deepEqual(parseVariants('S:6, M:10'), [{ size: 'S', stock: 6 }, { size: 'M', stock: 10 }]);
});
test('parseVariants: objeto {S:6}', () => assert.deepEqual(parseVariants({ S: 6 }), [{ size: 'S', stock: 6 }]));
test('parseVariants: texto vacío -> lista vacía', () => assert.deepEqual(parseVariants(''), []));
test('parseVariants: formatos inválidos -> null', () => {
  for (const bad of ['S', 'S:x', 'S:-1', 'S:1.5', ':5', { S: -2 }, { S: 'abc' }]) assert.equal(parseVariants(bad), null, JSON.stringify(bad));
});
test('parseVariants: permite stock 0 (talla agotada)', () => assert.deepEqual(parseVariants('XL:0'), [{ size: 'XL', stock: 0 }]));

test('producto válido pasa la validación', () => assert.deepEqual(errs(new Product(base)), {}));
test('producto sin nombre o sin categoría falla', () => {
  assert.ok(errs(new Product({ ...base, name: '' })).name);
  assert.ok(errs(new Product({ ...base, category: undefined })).category);
});
test('precio decimal o negativo falla; null ("por confirmar") es válido', () => {
  assert.ok(errs(new Product({ ...base, price: 100.5 })).price);
  assert.ok(errs(new Product({ ...base, price: -1 })).price);
  assert.deepEqual(errs(new Product({ ...base, price: null })), {});
});
test('tallas repetidas fallan', () => {
  assert.ok(errs(new Product({ ...base, variants: [{ size: 'M', stock: 1 }, { size: 'M', stock: 2 }] })).variants);
});
test('stock negativo o decimal falla', () => {
  assert.ok(Object.keys(errs(new Product({ ...base, variants: [{ size: 'M', stock: -1 }] }))).length);
  assert.ok(Object.keys(errs(new Product({ ...base, variants: [{ size: 'M', stock: 2.5 }] }))).length);
});
test('género fuera de la lista falla', () => {
  assert.ok(Object.keys(errs(new Product({ ...base, genders: ['otro'] }))).length);
});
test('el stock total es la suma de las tallas; sin tallas es null', () => {
  assert.equal(new Product({ ...base, variants: [{ size: 'S', stock: 6 }, { size: 'M', stock: 10 }] }).stock, 16);
  assert.equal(new Product({ ...base, variants: [] }).stock, null);
});
test('se genera un SKU automático si no se envía', () => assert.match(new Product(base).sku, /^VS-/));

test('flujo de estados: 6 pasos + Cancelado; solo se cancela antes del despacho', () => {
  assert.equal(FLOW.length, 6);
  assert.ok(ORDER_STATUSES.includes('Cancelado') && !FLOW.includes('Cancelado'));
  assert.deepEqual(CANCELABLE, ['Pago confirmado', 'En preparación', 'Empacado']);
  for (const s of CANCELABLE) assert.ok(FLOW.indexOf(s) < FLOW.indexOf('Entregado a la transportadora'));
});
test('pedido: estado inválido, cantidad 0 y total negativo fallan', () => {
  const ok = { code: 'VOLT-2000', customerName: 'Ana', city: 'Cali', total: 99900, items: [{ name: 'Polo', qty: 1, price: 89900 }] };
  assert.deepEqual(errs(new Order(ok)), {});
  assert.ok(errs(new Order({ ...ok, status: 'Volando' })).status);
  assert.ok(Object.keys(errs(new Order({ ...ok, items: [{ name: 'Polo', qty: 0, price: 1 }] }))).length);
  assert.ok(errs(new Order({ ...ok, total: -5 })).total);
});
