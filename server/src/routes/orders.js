import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import Order, { ORDER_STATUSES, PAYMENT_METHODS } from '../models/Order.js';
import Product from '../models/Product.js';
import Counter from '../models/Counter.js';
import { requireAdmin, requireCustomer } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { CITIES, SHIPPING_FEE, estimateDelivery } from '../data/shipping.js';

const router = Router();
const CODE_RE = /^VOLT-\d{3,8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIRST_REAL_ORDER = 1003; // los pedidos de ejemplo usan 1001 a 1003; el primero real es VOLT-1004

// Frena a quien intenta adivinar números de pedido
const trackLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  message: { error: { message: 'Hiciste muchas consultas seguidas. Intenta en unos minutos.' } }
});
const buyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  message: { error: { message: 'Hiciste muchos pedidos seguidos. Intenta en unos minutos.' } }
});

// Público: envío fijo y ciudades con su tiempo de entrega (el sitio arma el formulario con esto)
router.get('/shipping', (_req, res) => res.json({ fee: SHIPPING_FEE, cities: CITIES, paymentMethods: PAYMENT_METHODS }));

// Público: rastreo por número de pedido. Devuelve solo lo necesario: nada de correo, teléfono ni dirección.
router.get(
  '/track/:code',
  trackLimiter,
  asyncHandler(async (req, res) => {
    const code = String(req.params.code).toUpperCase().trim();
    if (!CODE_RE.test(code)) throw new HttpError(400, 'El número de pedido tiene un formato como VOLT-1001.');
    const order = await Order.findOne({ code }).select('code status city items total shipping paymentMethod estimatedDelivery history createdAt');
    if (!order) throw new HttpError(404, 'No encontramos un pedido con ese número. Revisa el correo de confirmación.');
    res.json(order);
  })
);

// Cliente con sesión: sus pedidos
router.get(
  '/mine',
  requireCustomer,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ customer: req.customer.id }).sort({ createdAt: -1 }).limit(50).select('code status total createdAt items');
    res.json(orders);
  })
);

/** Siguiente número de pedido, sin repetir aunque dos clientes compren a la vez. */
async function nextCode() {
  const c = await Counter.findOneAndUpdate({ _id: 'order' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `VOLT-${FIRST_REAL_ORDER + c.seq}`;
}

// Crear pedido (solo con sesión iniciada). El precio y el stock se toman SIEMPRE de la base de datos, nunca del navegador.
router.post(
  '/',
  buyLimiter,
  requireCustomer, // comprar exige una cuenta: iniciar sesión o crearla
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const text = (v) => (typeof v === 'string' ? v.trim() : '');
    const name = text(b.name), email = text(b.email).toLowerCase(), phone = text(b.phone).replace(/[\s()-]/g, '');
    const address = text(b.address), notes = text(b.notes), city = text(b.city), paymentMethod = text(b.paymentMethod);

    if (name.length < 2) throw new HttpError(400, 'Escribe tu nombre.');
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'El correo no tiene un formato válido.');
    if (!/^\+?\d{7,15}$/.test(phone)) throw new HttpError(400, 'Escribe un teléfono válido (solo números).');
    if (!CITIES.some((c) => c.name === city)) throw new HttpError(400, 'Elige una ciudad de la lista.');
    if (address.length < 6) throw new HttpError(400, 'Escribe tu dirección completa.');
    if (!PAYMENT_METHODS.includes(paymentMethod)) throw new HttpError(400, 'Elige un medio de pago.');
    if (b.acceptTerms !== true) throw new HttpError(400, 'Debes aceptar los términos y condiciones para comprar.');
    if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 20) throw new HttpError(400, 'Tu bolsa está vacía.');

    // Une líneas repetidas (misma prenda y talla) y valida cada una
    const lines = new Map();
    for (const it of b.items) {
      const productId = typeof it?.productId === 'string' ? it.productId : '';
      const size = text(it?.size);
      const qty = Number(it?.qty);
      if (!mongoose.isValidObjectId(productId)) throw new HttpError(400, 'Una prenda de tu bolsa no es válida.');
      if (!Number.isInteger(qty) || qty < 1 || qty > 10) throw new HttpError(400, 'La cantidad de cada prenda debe estar entre 1 y 10.');
      const key = `${productId}|${size}`;
      lines.set(key, { productId, size, qty: (lines.get(key)?.qty || 0) + qty });
    }

    const products = await Product.find({ _id: { $in: [...new Set([...lines.values()].map((l) => l.productId))] }, active: true });
    const byId = new Map(products.map((p) => [String(p._id), p]));
    const items = [];
    for (const l of lines.values()) {
      const p = byId.get(l.productId);
      if (!p) throw new HttpError(400, 'Una prenda de tu bolsa ya no está disponible.');
      if (p.price == null) throw new HttpError(400, `"${p.name}" todavía no tiene precio.`);
      if (!l.size || !p.sizes.includes(l.size)) throw new HttpError(400, `Elige una talla válida para "${p.name}".`);
      if (p.stock == null || p.stock < l.qty) throw new HttpError(409, `No hay suficiente stock de "${p.name}" (disponibles: ${p.stock ?? 0}).`);
      items.push({ product: p._id, name: p.name, size: l.size, qty: l.qty, price: p.price });
    }

    // Descuenta el stock al crear el pedido, de forma atómica; si algo falla, devuelve lo descontado
    const taken = [];
    try {
      for (const it of items) {
        const res1 = await Product.updateOne({ _id: it.product, stock: { $gte: it.qty } }, { $inc: { stock: -it.qty } });
        if (res1.modifiedCount !== 1) throw new HttpError(409, `Alguien compró "${it.name}" justo antes que tú y ya no hay suficiente stock.`);
        taken.push(it);
      }
      const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
      const paid = paymentMethod !== 'Contra entrega'; // la pasarela de este sitio es simulada y aprueba el pago
      const status = paid ? 'Pagado' : 'Pendiente';
      const order = await Order.create({
        code: await nextCode(),
        status,
        customer: req.customer.id,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        city,
        address,
        notes,
        paymentMethod,
        items,
        shipping: SHIPPING_FEE,
        total: subtotal + SHIPPING_FEE,
        estimatedDelivery: estimateDelivery(city),
        history: paid ? [{ status: 'Pendiente' }, { status: 'Pagado' }] : [{ status: 'Pendiente' }]
      });
      res.status(201).json({ code: order.code, status: order.status, total: order.total });
    } catch (err) {
      for (const it of taken) await Product.updateOne({ _id: it.product }, { $inc: { stock: it.qty } }).catch(() => {});
      throw err;
    }
  })
);

// Admin: lista de pedidos
router.get(
  '/',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    res.json(await Order.find().sort({ createdAt: -1 }).limit(200));
  })
);

// Admin: cambiar el estado (queda en el historial). Al cancelar se repone el stock.
router.patch(
  '/:code/status',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, `Estado no válido. Usa uno de: ${ORDER_STATUSES.join(', ')}.`);
    const order = await Order.findOne({ code: String(req.params.code).toUpperCase() });
    if (!order) throw new HttpError(404, 'El pedido no existe.');
    if (order.status === 'Cancelado') throw new HttpError(409, 'Un pedido cancelado ya no se puede cambiar.');
    if (status === 'Cancelado') {
      for (const it of order.items) if (it.product) await Product.updateOne({ _id: it.product }, { $inc: { stock: it.qty } });
    }
    order.status = status;
    order.history.push({ status });
    await order.save();
    res.json(order);
  })
);

// Admin: quitar un pedido (por ejemplo, uno de prueba). Si seguía en curso, repone el stock.
router.delete(
  '/:code',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ code: String(req.params.code).toUpperCase() });
    if (!order) throw new HttpError(404, 'El pedido no existe.');
    if (!['Cancelado', 'Entregado'].includes(order.status)) {
      for (const it of order.items) if (it.product) await Product.updateOne({ _id: it.product }, { $inc: { stock: it.qty } });
    }
    await order.deleteOne();
    res.json({ ok: true, code: order.code });
  })
);

export default router;
