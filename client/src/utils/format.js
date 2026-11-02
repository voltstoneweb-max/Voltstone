/** Formatea un entero como pesos colombianos: 89900 -> $89.900 */
export const cop = (n) => '$' + Number(n).toLocaleString('es-CO');
export const CATEGORIES = { camiseta: 'Camisetas', polo: 'Polos', pantalon: 'Pantalones', chaqueta: 'Chaquetas' };
