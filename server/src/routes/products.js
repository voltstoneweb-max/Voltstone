import { Router } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';

const router = Router();
const FIELDS = ['sku', 'name', 'category', 'genders', 'materials', 'price', 'description', 'colors', 'sizes', 'stock', 'imageUrl', 'active'];
// Solo se aceptan campos conocidos (evita que el cliente escriba campos arbitrarios)
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
const SORT = { order: 1, sku: 1 }; // orden del catálogo maestro

// Público: solo productos activos. Filtros opcionales ?gender=mujer&category=Pantalones
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = { active: true };
    // typeof === 'string' bloquea inyección NoSQL por query (?gender[$ne]=x)
    if (typeof req.query.gender === 'string') filter.genders = req.query.gender;
    if (typeof req.query.category === 'string') filter.category = req.query.category;
    res.json(await Product.find(filter).sort(SORT));
  })
);

// Admin: lista completa (incluye ocultos)
router.get('/all', requireAdmin, asyncHandler(async (_req, res) => res.json(await Product.find().sort(SORT))));

// Público: una prenda activa (página de producto). Va después de /all para que no se confundan.
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'El identificador del producto no es válido.');
    const product = await Product.findOne({ _id: req.params.id, active: true });
    if (!product) throw new HttpError(404, 'No encontramos esa prenda.');
    res.json(product);
  })
);

router.post('/', requireAdmin, asyncHandler(async (req, res) => res.status(201).json(await Product.create(pick(req.body || {})))));

router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const updated = await Product.findByIdAndUpdate(req.params.id, pick(req.body || {}), { new: true, runValidators: true });
    if (!updated) throw new HttpError(404, 'El producto no existe.');
    res.json(updated);
  })
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) throw new HttpError(404, 'El producto no existe.');
    res.json({ ok: true });
  })
);

export default router;
