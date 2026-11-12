/**
 * Solo para pruebas automáticas (CI): con RATE_LIMIT_SKIP=1 los límites de peticiones se saltan,
 * porque la batería de pruebas hace muchas compras y logins seguidos desde la misma IP.
 * En producción (NODE_ENV=production) NUNCA se salta, aunque la variable exista.
 */
export const skipInTests = () => process.env.RATE_LIMIT_SKIP === '1' && process.env.NODE_ENV !== 'production';
