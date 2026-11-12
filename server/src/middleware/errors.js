/** Error con código HTTP y mensaje claro para el usuario. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Envuelve controladores async para que los errores lleguen a errorHandler. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const notFound = (req, res) =>
  res.status(404).json({ error: { message: `La ruta ${req.method} ${req.originalUrl} no existe.` } });

/** Manejador central: convierte cualquier error en una respuesta JSON consistente. */
export function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let message = err.message;

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(' ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'El identificador o un valor enviado no es válido.';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Ya existe un registro con ese valor único (por ejemplo, el SKU).';
  } else if (err.type === 'entity.too.large' || err.status === 413) {
    status = 413;
    message = 'Los datos enviados son demasiado grandes. Reduce el tamaño e intenta de nuevo.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'El cuerpo de la solicitud no es un JSON válido.';
  } else if (status === 500 || !err.status) {
    status = 500;
    console.error(err); // el detalle técnico solo va al log, no al cliente
    message = 'Ocurrió un error en el servidor. Intenta de nuevo más tarde.';
  }
  res.status(status).json({ error: { message } });
}
