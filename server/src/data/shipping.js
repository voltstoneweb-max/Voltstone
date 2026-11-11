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

const bogota = (d) => new Date(d.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
const isBusiness = (d) => d.getDay() !== 0 && d.getDay() !== 6; // sin festivos (simplificación)

/** Fecha estimada de entrega: si se paga antes de las 14:00 de un día hábil sale ese día; si no, el siguiente hábil. */
export function estimateDelivery(cityName, from = new Date()) {
  const city = CITIES.find((c) => c.name === cityName) || CITIES.at(-1);
  const d = bogota(from);
  if (!isBusiness(d) || d.getHours() >= 14) {
    do { d.setDate(d.getDate() + 1); } while (!isBusiness(d));
  }
  let left = city.max;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (isBusiness(d)) left -= 1;
  }
  return d;
}
