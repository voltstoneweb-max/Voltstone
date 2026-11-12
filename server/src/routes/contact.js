import { Router } from 'express';
import { randomInt } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { skipInTests } from '../middleware/rateLimitSkip.js';
import Message, { REASONS } from '../models/Message.js';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';

const router = Router();
const EMAIL_RE = /^[^\s@?]+@[^\s@?]+\.[^\s@?]+$/; // sin espacios ni signos de pregunta
const LABELS = {
  producto: 'Pregunta sobre un producto',
  pedido: 'Estado de mi pedido',
  devolucion: 'Devolución o cambio de talla',
  garantia: 'Garantía por defecto de fabricación',
  pagos: 'Pagos y facturación',
  pqrs: 'Petición, queja o reclamo',
  otro: 'Otro tema'
};

// Evita spam en el formulario público
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  skip: skipInTests,
  message: { error: { message: 'Enviaste muchos mensajes seguidos. Intenta en unos minutos.' } }
});

router.post(
  '/',
  contactLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, message, reason = 'otro', orderNumber = '', productRef = '', acceptDataPolicy } = req.body || {};
    if (!name || !email || !message) throw new HttpError(400, 'Completa tu nombre, correo y mensaje.');
    // Solo texto: rechaza objetos (inyección NoSQL) antes de tocar la base de datos
    if ([name, email, message, reason, orderNumber, productRef].some((v) => typeof v !== 'string')) throw new HttpError(400, 'Los campos deben ser texto.');
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'El correo no tiene un formato válido.');
    if (!REASONS.includes(reason)) throw new HttpError(400, 'Elige un motivo de contacto válido.');
    if (acceptDataPolicy !== true) throw new HttpError(400, 'Debes autorizar el tratamiento de tus datos personales para enviar el formulario.');

    // Número de caso para seguimiento (se reintenta si, por azar, ya existe)
    let saved;
    for (let i = 0; i < 3 && !saved; i++) {
      const ticket = `VS-${new Date().getFullYear()}-${randomInt(100000, 1000000)}`;
      try {
        saved = await Message.create({ ticket, reason, orderNumber, productRef, name, email, subject: LABELS[reason], message, dataAuthorizedAt: new Date() });
      } catch (err) {
        if (err.code !== 11000) throw err;
      }
    }
    if (!saved) throw new HttpError(500, 'No pudimos generar tu número de caso. Intenta de nuevo.');
    res.status(201).json({ ok: true, ticket: saved.ticket });
  })
);

router.get('/', requireAdmin, asyncHandler(async (_req, res) => res.json(await Message.find().sort({ createdAt: -1 }))));

router.patch(
  '/:id/read',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const m = await Message.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!m) throw new HttpError(404, 'El mensaje no existe.');
    res.json(m);
  })
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  })
);

export default router;
