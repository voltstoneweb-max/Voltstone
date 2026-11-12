import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'secreto-de-prueba-unitaria-0123456789abcdef';
const { requireAdmin, requireCustomer, optionalCustomer } = await import('../../src/middleware/auth.js');

const SECRET = process.env.JWT_SECRET;
const sign = (payload, opts = {}, secret = SECRET) => jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '1h', ...opts });
const run = (mw, token) => {
  const req = { headers: token ? { authorization: `Bearer ${token}` } : {} };
  let arg = 'no-llamado';
  mw(req, {}, (e) => { arg = e; });
  return { req, err: arg };
};

test('sin token -> 401', () => {
  assert.equal(run(requireAdmin).err.status, 401);
  assert.equal(run(requireCustomer).err.status, 401);
});

test('encabezado sin "Bearer " -> 401', () => {
  const req = { headers: { authorization: sign({ role: 'admin' }) } };
  let err; requireAdmin(req, {}, (e) => { err = e; });
  assert.equal(err.status, 401);
});

test('token de administrador abre las rutas de administrador', () => {
  const { req, err } = run(requireAdmin, sign({ id: '1', role: 'admin' }));
  assert.equal(err, undefined);
  assert.equal(req.admin.role, 'admin');
});

test('un token de CLIENTE no entra al panel (403)', () => {
  assert.equal(run(requireAdmin, sign({ id: '1', role: 'customer' })).err.status, 403);
});

test('un token de ADMIN no sirve como cliente (403)', () => {
  assert.equal(run(requireCustomer, sign({ id: '1', role: 'admin' })).err.status, 403);
});

test('token firmado con otra clave -> 401', () => {
  assert.equal(run(requireAdmin, sign({ role: 'admin' }, {}, 'otra-clave-distinta-0123456789abcdef!!')).err.status, 401);
});

test('token manipulado -> 401', () => {
  const t = sign({ role: 'customer' });
  assert.equal(run(requireCustomer, t.slice(0, -3) + 'xyz').err.status, 401);
});

test('token vencido -> 401', () => {
  assert.equal(run(requireAdmin, sign({ role: 'admin' }, { expiresIn: -10 })).err.status, 401);
});

test('algoritmo distinto (HS512) se rechaza: el algoritmo está fijado en HS256', () => {
  assert.equal(run(requireAdmin, sign({ role: 'admin' }, { algorithm: 'HS512' })).err.status, 401);
});

test('token "alg: none" se rechaza', () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const none = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ role: 'admin' })}.`;
  assert.equal(run(requireAdmin, none).err.status, 401);
});

test('optionalCustomer: sin token deja pasar como invitado', () => {
  const { req, err } = run(optionalCustomer);
  assert.equal(err, undefined);
  assert.equal(req.customer, null);
});

test('optionalCustomer: token válido de cliente se usa; el de admin se ignora', () => {
  assert.equal(run(optionalCustomer, sign({ id: '7', role: 'customer' })).req.customer.id, '7');
  assert.equal(run(optionalCustomer, sign({ id: '7', role: 'admin' })).req.customer, null);
});
