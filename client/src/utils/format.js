/** Formatea un entero como pesos colombianos: 89900 -> $89.900. Sin precio: "Precio por confirmar". */
export const cop = (n) => (n == null ? 'Precio por confirmar' : '$' + Number(n).toLocaleString('es-CO'));

const GENDER = { hombre: 'Hombre', mujer: 'Mujer' };
export const genderText = (g = []) => (g.length >= 2 ? 'Hombre y mujer' : g.map((x) => GENDER[x]).join(''));

/** Quita tildes y mayúsculas para que la búsqueda encuentre "pantalon" aunque diga "Pantalón". */
export const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Colores del catálogo -> muestra visual (se busca la palabra clave dentro del nombre del color)
const SWATCH = [['negro', '#141414'], ['blanco', '#f1f1ee'], ['amarillo', '#E5A526'], ['gris', '#8b8f94'], ['oliv', '#5d6234'], ['verde', '#3f6b45'], ['azul', '#1f3a8a'], ['beige', '#d8c3a5']];
export const swatch = (name) => (SWATCH.find(([k]) => String(name).toLowerCase().includes(k)) || [, '#6b6b70'])[1];

// Las rutas de foto que empiezan por "/" se prefijan con la base de Vite (GitHub Pages); las relativas ya funcionan
export const imgSrc = (u) => (u && u.startsWith('/') ? import.meta.env.BASE_URL + u.slice(1) : u);
