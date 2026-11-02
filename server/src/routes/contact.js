import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import Message from '../models/Message.js';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Evita spam en el formulario público
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  message: { error: { message: 'Enviaste muchos mensajes seguidos. Intenta en unos minutos.' } }
});

router.post(
  '/',
  contactLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !subject || !message) throw new HttpError(400, 'Completa todos los campos.');
    // Solo texto: rechaza objetos (inyección NoSQL) antes de tocar la base de datos
    if ([name, email, subject, message].some((v) => typeof v !== 'string')) throw new HttpError(400, 'Los campos deben ser texto.');
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'El correo no tiene un formato válido.');
    await Message.create({ name, email, subject, message });
    res.status(201).json({ ok: true });
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
