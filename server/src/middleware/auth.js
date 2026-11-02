import jwt from 'jsonwebtoken';
import { HttpError } from './errors.js';

/** Protege rutas del panel: exige "Authorization: Bearer <token>" válido. */
export function requireAdmin(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Debes iniciar sesión como administrador.'));
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }) // algoritmo fijo: impide tokens con otro algoritmo;
    next();
  } catch {
    next(new HttpError(401, 'Tu sesión expiró. Inicia sesión de nuevo.'));
  }
}
