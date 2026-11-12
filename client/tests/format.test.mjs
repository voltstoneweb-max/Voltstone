import test from 'node:test';
import assert from 'node:assert/strict';
import { cop, genderText, norm, swatch, imgSrc } from '../src/utils/format.js';

test('cop: pesos colombianos con punto de miles', () => {
  assert.equal(cop(89900), '$89.900');
  assert.equal(cop(1234567), '$1.234.567');
  assert.equal(cop(0), '$0');
});
test('cop: sin precio -> "Precio por confirmar"', () => {
  assert.equal(cop(null), 'Precio por confirmar');
  assert.equal(cop(undefined), 'Precio por confirmar');
});
test('genderText', () => {
  assert.equal(genderText(['hombre', 'mujer']), 'Hombre y mujer');
  assert.equal(genderText(['mujer']), 'Mujer');
  assert.equal(genderText(['hombre']), 'Hombre');
  assert.equal(genderText(), '');
});
test('norm: quita tildes y mayúsculas (la búsqueda encuentra "pantalon")', () => {
  assert.equal(norm('Pantalón Básico'), 'pantalon basico');
  assert.equal(norm('NYLON'), 'nylon');
  assert.equal(norm(123), '123');
});
test('swatch: reconoce colores por palabra clave y tiene color por defecto', () => {
  assert.equal(swatch('Negro mate'), '#141414');
  assert.equal(swatch('Azul rey'), '#1f3a8a');
  assert.equal(swatch('Verde oliva'), '#5d6234'); // "oliv" va antes que "verde"
  assert.equal(swatch('Fucsia'), '#6b6b70');
});
test('imgSrc: las rutas relativas y vacías no se alteran', () => {
  assert.equal(imgSrc('img/productos/polo.jpg'), 'img/productos/polo.jpg');
  assert.equal(imgSrc(''), '');
  assert.equal(imgSrc(undefined), undefined);
});
