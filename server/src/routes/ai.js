import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { skipInTests } from '../middleware/rateLimitSkip.js';
import { chat, generateText } from '../services/ai.js';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';

const router = Router();

// Protege la cuota gratuita de la IA
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  skip: skipInTests,
  message: { error: { message: 'Estás escribiendo muy rápido. Espera un minuto.' } }
});

// Público: chatbot VoltBot
router.post(
  '/chat',
  aiLimiter,
  asyncHandler(async (req, res) => {
    const { message, history } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) throw new HttpError(400, 'Escribe tu pregunta.');
    if (message.length > 500) throw new HttpError(400, 'La pregunta es muy larga (máximo 500 caracteres).');
    const safeHistory = Array.isArray(history) ? history.slice(-6) : [];
    res.json({ reply: await chat(message.trim(), safeHistory) });
  })
);

// Admin: generador de textos listos
router.post(
  '/generate-text',
  requireAdmin,
  aiLimiter,
  asyncHandler(async (req, res) => {
    const { name, category, gender } = req.body || {};
    if (!name || !category || !gender) throw new HttpError(400, 'Indica nombre, categoría y género de la prenda.');
    res.json({ text: await generateText(req.body) });
  })
);

export default router;
