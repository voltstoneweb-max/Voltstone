import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { skipInTests } from '../middleware/rateLimitSkip.js';
import Customer from '../models/Customer.js';
import { requireCustomer } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';

const router = Router();
const EMAIL_RE = /^[^\s@?]+@[^\s@?]+\.[^\s@?]+$/; // sin espacios ni signos de pregunta
const DUMMY_HASH = bcrypt.hashSync('no-es-una-clave-real', 10);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  skip: skipInTests,
  message: { error: { message: 'Demasiados intentos. Espera 15 minutos.' } }
});

// El rol va dentro del token: un token de cliente nunca sirve en las rutas de administrador
const sign = (c) => jwt.sign({ id: c._id, email: c.email, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });

router.post(
  '/register',
  limiter,
  asyncHandler(async (req, res) => {
    const { name, email, password, acceptTerms, acceptDataPolicy } = req.body || {};
    if ([name, email, password].some((v) => typeof v !== 'string')) throw new HttpError(400, 'Completa todos los campos.');
    if (name.trim().length < 2) throw new HttpError(400, 'Escribe tu nombre.');
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'El correo no tiene un formato válido.');
    if (password.length < 8) throw new HttpError(400, 'La clave debe tener al menos 8 caracteres.');
    if (acceptTerms !== true || acceptDataPolicy !== true) {
      throw new HttpError(400, 'Para crear tu cuenta debes aceptar los términos y condiciones y el tratamiento de datos personales.');
    }
    const mail = email.toLowerCase().trim();
    if (await Customer.exists({ email: mail })) throw new HttpError(409, 'No pudimos crear la cuenta con esos datos. Si ya tienes una, inicia sesión.');
    const now = new Date();
    const c = await Customer.create({
      name: name.trim(),
      email: mail,
      passwordHash: await bcrypt.hash(password, 10),
      acceptedTermsAt: now,
      acceptedDataPolicyAt: now
    });
    res.status(201).json({ token: sign(c), name: c.name, email: c.email });
  })
);

router.post(
  '/login',
  limiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw new HttpError(400, 'Escribe tu correo y tu clave.');
    // String(...) evita inyección NoSQL como {"$ne": null}
    const c = await Customer.findOne({ email: String(email).toLowerCase().trim() });
    const match = await bcrypt.compare(String(password), c?.passwordHash || DUMMY_HASH);
    if (!c || !match) throw new HttpError(401, 'Correo o clave incorrectos.');
    res.json({ token: sign(c), name: c.name, email: c.email });
  })
);

router.get(
  '/me',
  requireCustomer,
  asyncHandler(async (req, res) => {
    const c = await Customer.findById(req.customer.id).select('name email createdAt');
    if (!c) throw new HttpError(401, 'Tu cuenta ya no existe. Crea una nueva.');
    res.json(c);
  })
);

export default router;
