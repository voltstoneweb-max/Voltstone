import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { skipInTests } from '../middleware/rateLimitSkip.js';
import Question from '../models/Question.js';
import Product from '../models/Product.js';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';

const router = Router();
const EMAIL_RE = /^[^\s@?]+@[^\s@?]+\.[^\s@?]+$/; // sin espacios ni signos de pregunta

const askLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  skip: skipInTests,
  message: { error: { message: 'Enviaste muchas preguntas seguidas. Intenta en unos minutos.' } }
});

// Público: solo preguntas YA respondidas por el vendedor, sin correo
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const id = req.query.product;
    if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) throw new HttpError(400, 'Indica el producto.');
    const list = await Question.find({ product: id, answer: { $ne: '' } })
      .sort({ answeredAt: -1 })
      .limit(30)
      .select('name question answer answeredAt');
    res.json(list);
  })
);

// Público: hacer una pregunta al vendedor
router.post(
  '/',
  askLimiter,
  asyncHandler(async (req, res) => {
    const { productId, name, email, question, acceptDataPolicy } = req.body || {};
    if ([productId, name, email, question].some((v) => typeof v !== 'string')) throw new HttpError(400, 'Completa todos los campos.');
    if (!mongoose.isValidObjectId(productId)) throw new HttpError(400, 'El producto no es válido.');
    if (name.trim().length < 2) throw new HttpError(400, 'Escribe tu nombre.');
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'El correo no tiene un formato válido.');
    if (question.trim().length < 10) throw new HttpError(400, 'Escribe tu pregunta con un poco más de detalle (mínimo 10 caracteres).');
    if (acceptDataPolicy !== true) throw new HttpError(400, 'Debes autorizar el tratamiento de tus datos personales para enviar tu pregunta.');
    if (!(await Product.exists({ _id: productId, active: true }))) throw new HttpError(404, 'El producto no existe.');
    await Question.create({ product: productId, name, email, question, dataAuthorizedAt: new Date() });
    res.status(201).json({ ok: true });
  })
);

// Admin: todas las preguntas (primero las pendientes)
router.get(
  '/all',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const list = await Question.find().populate('product', 'name sku').sort({ createdAt: -1 });
    res.json(list.sort((a, b) => Number(!!a.answer) - Number(!!b.answer)));
  })
);

router.patch(
  '/:id/answer',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { answer } = req.body || {};
    if (typeof answer !== 'string' || answer.trim().length < 3) throw new HttpError(400, 'Escribe la respuesta (mínimo 3 caracteres).');
    const q = await Question.findByIdAndUpdate(req.params.id, { answer: answer.trim().slice(0, 600), answeredAt: new Date() }, { new: true });
    if (!q) throw new HttpError(404, 'La pregunta no existe.');
    res.json(q);
  })
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  })
);

export default router;
