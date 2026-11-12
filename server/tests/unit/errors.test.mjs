import test from 'node:test';
import assert from 'node:assert/strict';
import { HttpError, errorHandler, notFound, asyncHandler } from '../../src/middleware/errors.js';

const mockRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
};

test('HttpError conserva código y mensaje', () => {
  const e = new HttpError(418, 'tetera');
  assert.equal(e.status, 418);
  assert.equal(e.message, 'tetera');
});

test('un HttpError se devuelve tal cual', () => {
  const res = mockRes();
  errorHandler(new HttpError(409, 'Sin stock'), {}, res, () => {});
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, { error: { message: 'Sin stock' } });
});

test('ValidationError de Mongoose -> 400 con los mensajes unidos', () => {
  const res = mockRes();
  const err = Object.assign(new Error('x'), { name: 'ValidationError', errors: { a: { message: 'Falta A.' }, b: { message: 'Falta B.' } } });
  errorHandler(err, {}, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.message, 'Falta A. Falta B.');
});

test('CastError -> 400', () => {
  const res = mockRes();
  errorHandler(Object.assign(new Error('x'), { name: 'CastError' }), {}, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('clave duplicada (11000) -> 409', () => {
  const res = mockRes();
  errorHandler(Object.assign(new Error('dup'), { code: 11000 }), {}, res, () => {});
  assert.equal(res.statusCode, 409);
});

test('cuerpo demasiado grande -> 413', () => {
  const res = mockRes();
  errorHandler(Object.assign(new Error('big'), { type: 'entity.too.large', status: 413 }), {}, res, () => {});
  assert.equal(res.statusCode, 413);
});

test('JSON inválido -> 400', () => {
  const res = mockRes();
  errorHandler(Object.assign(new Error('bad'), { type: 'entity.parse.failed', status: 400 }), {}, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error.message, /JSON/);
});

test('un error inesperado -> 500 y NO filtra el detalle técnico', (t) => {
  t.mock.method(console, 'error', () => {});
  const res = mockRes();
  errorHandler(new Error('password=supersecreta en la cadena de conexión'), {}, res, () => {});
  assert.equal(res.statusCode, 500);
  assert.doesNotMatch(JSON.stringify(res.body), /supersecreta/);
});

test('notFound responde 404 en JSON con el método y la ruta', () => {
  const res = mockRes();
  notFound({ method: 'GET', originalUrl: '/api/nada' }, res);
  assert.equal(res.statusCode, 404);
  assert.match(res.body.error.message, /GET \/api\/nada/);
});

test('asyncHandler envía los errores async a next()', async () => {
  const boom = new Error('boom');
  let received;
  await asyncHandler(async () => { throw boom; })({}, {}, (e) => { received = e; });
  assert.equal(received, boom);
});
