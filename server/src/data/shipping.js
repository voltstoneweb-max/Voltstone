// Envío fijo y zonas de entrega. Única fuente: el sitio pide esta lista al servidor (GET /api/orders/shipping).
// Los tiempos coinciden con la política de envíos: Cali 1 día hábil, principales 2 a 4, intermedias 3 a 5, remotas 5 a 8.
export const SHIPPING_FEE = 10000;

export const ZONES = {
  cali: { label: 'Cali y alrededores', min: 1, max: 1 },
  principal: { label: 'Ciudad principal', min: 2, max: 4 },
  intermedia: { label: 'Ciudad intermedia', min: 3, max: 5 },
  remota: { label: 'Municipio o zona remota', min: 5, max: 8 }
};

export const CITIES = [
  ['Cali', 'cali'], ['Jamundí', 'cali'], ['Yumbo', 'cali'], ['Palmira', 'cali'],
  ['Bogotá', 'principal'], ['Medellín', 'principal'], ['Barranquilla', 'principal'], ['Cartagena', 'principal'], ['Bucaramanga', 'principal'],
  ['Pereira', 'intermedia'], ['Manizales', 'intermedia'], ['Armenia', 'intermedia'], ['Ibagué', 'intermedia'], ['Cúcuta', 'intermedia'],
  ['Villavicencio', 'intermedia'], ['Popayán', 'intermedia'], ['Pasto', 'intermedia'],
  ['Otro municipio o pueblo', 'remota']
].map(([name, zone]) => ({ name, zone, ...ZONES[zone] }));

// ---- Fechas en hora de Colombia (sin depender de la zona horaria del servidor) ----
const pad = (n) => String(n).padStart(2, '0');
const key = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

/** Año, mes, día y hora actuales en Bogotá. Una compra a las 00:30 en Colombia cuenta como ese día, no el anterior. */
function bogotaParts(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit' })
      .formatToParts(date).map((p) => [p.type, p.value])
  );
  return { y: +parts.year, m: +parts.month, d: +parts.day, h: +parts.hour };
}

const addDays = (utc, n) => new Date(utc.getTime() + n * 86400000);
const ymd = (utc) => key(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
const nextMonday = (utc) => addDays(utc, (8 - utc.getUTCDay()) % 7); // si ya es lunes, se queda

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher). */
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, month - 1, day));
}

const holidayCache = new Map();
/** Festivos de Colombia (Ley Emiliani): fijos, trasladados al lunes y los que dependen de Semana Santa. */
export function holidays(year) {
  if (holidayCache.has(year)) return holidayCache.get(year);
  const set = new Set();
  for (const [m, d] of [[1, 1], [5, 1], [7, 20], [8, 7], [12, 8], [12, 25]]) set.add(key(year, m, d));
  for (const [m, d] of [[1, 6], [3, 19], [6, 29], [8, 15], [10, 12], [11, 1], [11, 15]]) set.add(ymd(nextMonday(new Date(Date.UTC(year, m - 1, d)))));
  const pascua = easter(year);
  set.add(ymd(addDays(pascua, -3))); // Jueves Santo
  set.add(ymd(addDays(pascua, -2))); // Viernes Santo
  for (const n of [39, 60, 68]) set.add(ymd(nextMonday(addDays(pascua, n)))); // Ascensión, Corpus Christi, Sagrado Corazón
  holidayCache.set(year, set);
  return set;
}

const isBusiness = (utc) => utc.getUTCDay() !== 0 && utc.getUTCDay() !== 6 && !holidays(utc.getUTCFullYear()).has(ymd(utc));

/**
 * Fecha estimada de entrega (hora de Colombia, días hábiles sin fines de semana ni festivos).
 * Si se paga antes de las 14:00 de un día hábil sale ese día; si no, el siguiente hábil.
 * Devuelve las 12:00 de Bogotá del día de entrega, para que no "retroceda" un día al mostrarse.
 */
export function estimateDelivery(cityName, from = new Date()) {
  const city = CITIES.find((c) => c.name === cityName) || CITIES.at(-1);
  const { y, m, d, h } = bogotaParts(from);
  let day = new Date(Date.UTC(y, m - 1, d)); // calendario de Bogotá, a medianoche UTC
  if (!isBusiness(day) || h >= 14) {
    do { day = addDays(day, 1); } while (!isBusiness(day));
  }
  let left = city.max;
  while (left > 0) {
    day = addDays(day, 1);
    if (isBusiness(day)) left -= 1;
  }
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 17)); // 12:00 en Bogotá (UTC-5)
}
