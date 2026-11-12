import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { skipInTests } from '../middleware/rateLimitSkip.js';
import Admin from '../models/Admin.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';

const router = Router();
// Hash falso: se compara siempre, exista o no el correo, para que el tiempo de respuesta sea igual
const DUMMY_HASH = bcrypt.hashSync('no-es-una-clave-real', 10);

// Limita intentos de login para frenar ataques de fuerza bruta
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skip: skipInTests,
  message: { error: { message: 'Demasiados intentos. Espera 15 minutos.' } }
});

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw new HttpError(400, 'Escribe tu correo y tu clave.');
    // String(...) obliga a que sean texto: evita inyección NoSQL como {"$ne": null}
    const admin = await Admin.findOne({ email: String(email).toLowerCase().trim() });
    const match = await bcrypt.compare(String(password), admin?.passwordHash || DUMMY_HASH);
    // Mismo mensaje si falla el correo o la clave: no revela cuál es incorrecto
    if (!admin || !match) throw new HttpError(401, 'Correo o clave incorrectos.');
    const token = jwt.sign({ id: admin._id, email: admin.email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h', algorithm: 'HS256' });
    res.json({ token, email: admin.email });
  })
);

export default router;
