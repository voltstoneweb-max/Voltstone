import test from 'node:test';
import assert from 'node:assert/strict';
import { holidays, estimateDelivery, CITIES, SHIPPING_FEE } from '../../src/data/shipping.js';

// Instante UTC de una hora local de Bogotá (UTC-5, sin horario de verano)
const bogota = (y, m, d, h = 12) => new Date(Date.UTC(y, m - 1, d, h + 5));
const day = (date) => date.toISOString().slice(0, 10);

test('el envío es fijo de $10.000', () => assert.equal(SHIPPING_FEE, 10000));

test('las ciudades tienen zona y tiempos coherentes (min <= max)', () => {
  assert.ok(CITIES.length >= 10);
  for (const c of CITIES) {
    assert.ok(c.name && c.zone, `ciudad incompleta: ${JSON.stringify(c)}`);
    assert.ok(c.min >= 1 && c.min <= c.max, `${c.name}: tiempos inválidos`);
  }
  assert.equal(CITIES.find((c) => c.name === 'Cali').max, 1);
  assert.equal(CITIES.at(-1).zone, 'remota');
});

test('festivos de Colombia 2026 (fijos, Emiliani y Semana Santa)', () => {
  const h = holidays(2026);
  const esperados = ['2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01', '2026-05-18',
    '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02',
    '2026-11-16', '2026-12-08', '2026-12-25'];
  for (const f of esperados) assert.ok(h.has(f), `falta el festivo ${f}`);
  assert.equal(h.size, esperados.length);
});

test('un día normal NO es festivo', () => {
  assert.equal(holidays(2026).has('2026-11-10'), false);
});

test('Cali, pago un lunes hábil antes de las 14:00 -> entrega al día hábil siguiente', () => {
  assert.equal(day(estimateDelivery('Cali', bogota(2026, 11, 9, 10))), '2026-11-10');
});

test('pago después de las 14:00 cuenta desde el siguiente día hábil', () => {
  assert.equal(day(estimateDelivery('Cali', bogota(2026, 11, 9, 15))), '2026-11-11');
});

test('exactamente a las 14:00 ya cuenta como "después del corte"', () => {
  assert.equal(day(estimateDelivery('Cali', bogota(2026, 11, 9, 14))), '2026-11-11');
});

test('viernes tarde + fin de semana + festivo (lunes 16 nov) -> miércoles 18', () => {
  assert.equal(day(estimateDelivery('Cali', bogota(2026, 11, 13, 15))), '2026-11-18');
});

test('zona remota (8 días hábiles) saltando el festivo del 16 de noviembre', () => {
  assert.equal(day(estimateDelivery('Otro municipio o pueblo', bogota(2026, 11, 9, 10))), '2026-11-20');
});

test('una ciudad desconocida usa el tiempo de la zona remota', () => {
  const a = estimateDelivery('Ciudad inventada', bogota(2026, 11, 9, 10));
  const b = estimateDelivery('Otro municipio o pueblo', bogota(2026, 11, 9, 10));
  assert.equal(a.getTime(), b.getTime());
});

test('la fecha se devuelve a las 12:00 de Bogotá (17:00 UTC) para no "retroceder" un día', () => {
  assert.equal(estimateDelivery('Bogotá', bogota(2026, 11, 9, 10)).getUTCHours(), 17);
});

test('la hora se evalúa en Colombia, no en UTC (00:30 en Bogotá = 05:30 UTC del mismo día)', () => {
  // 00:30 de un lunes en Bogotá -> es lunes hábil, antes de las 14:00
  assert.equal(day(estimateDelivery('Cali', new Date(Date.UTC(2026, 10, 9, 5, 30)))), '2026-11-10');
});

test('sábado y domingo no son días de despacho: el conteo empieza el lunes hábil', () => {
  // sábado 14 nov 10:00 -> arranca lunes 16 (festivo) -> martes 17; Cali +1 hábil -> miércoles 18
  assert.equal(day(estimateDelivery('Cali', bogota(2026, 11, 14, 10))), '2026-11-18');
});
