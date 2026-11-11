import jwt from 'jsonwebtoken';
import { HttpError } from './errors.js';

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

/** Verifica el token con algoritmo fijo y exige el rol indicado (un token de cliente no entra al panel). */
function verify(req, role, missingMsg) {
  const token = readToken(req);
  if (!token) throw new HttpError(401, missingMsg);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw new HttpError(401, 'Tu sesión expiró. Inicia sesión de nuevo.');
  }
  if (payload.role !== role) throw new HttpError(403, 'No tienes permiso para esta acción.');
  return payload;
}

/** Protege rutas del panel: exige "Authorization: Bearer <token>" de administrador. */
export function requireAdmin(req, _res, next) {
  try {
    req.admin = verify(req, 'admin', 'Debes iniciar sesión como administrador.');
    next();
  } catch (err) {
    next(err);
  }
}

/** Protege rutas de la cuenta del cliente. */
export function requireCustomer(req, _res, next) {
  try {
    req.customer = verify(req, 'customer', 'Debes iniciar sesión.');
    next();
  } catch (err) {
    next(err);
  }
}

/** Si viene un token de cliente válido lo usa; si no, deja pasar (comprar como invitado). */
export function optionalCustomer(req, _res, next) {
  try {
    req.customer = verify(req, 'customer', '');
  } catch {
    req.customer = null;
  }
  next();
}
