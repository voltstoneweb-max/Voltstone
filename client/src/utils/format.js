/** Formatea un entero como pesos colombianos: 89900 -> $89.900. Sin precio: "Precio por confirmar". */
export const cop = (n) => (n == null ? 'Precio por confirmar' : '$' + Number(n).toLocaleString('es-CO'));

const GENDER = { hombre: 'Hombre', mujer: 'Mujer' };
export const genderText = (g = []) => (g.length >= 2 ? 'Hombre y mujer' : g.map((x) => GENDER[x]).join(''));

/** Quita tildes y mayúsculas para que la búsqueda encuentre "pantalon" aunque diga "Pantalón". */
export const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Colores del catálogo -> muestra visual (solo cuando una prenda ya tiene colores cargados).
const SWATCH = { negro: '#141414', blanco: '#f1f1ee', amarillo: '#F5C518', gris: '#8b8f94', 'verde oliva': '#5d6234' };
export const swatch = (name) => SWATCH[String(name).toLowerCase()] || '#6b6b70';
