import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import Order, { ORDER_STATUSES, FLOW, CANCELABLE, PAYMENT_METHODS, TERMS_VERSION } from '../models/Order.js';
import Product from '../models/Product.js';
import Counter from '../models/Counter.js';
import { requireAdmin, requireCustomer } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { CITIES, SHIPPING_FEE, estimateDelivery } from '../data/shipping.js';

const router = Router();
const CODE_RE = /^VOLT-\d{3,8}$/;
const EMAIL_RE = /^[^\s@?]+@[^\s@?]+\.[^\s@?]+$/; // sin espacios ni signos de pregunta
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

const text = (v) => (typeof v === 'string' ? v.trim() : '');
const publicOrder = (o) => ({
  code: o.code, status: o.status, city: o.city, items: o.items, total: o.total, shipping: o.shipping,
  paymentMethod: o.paymentMethod, estimatedDelivery: o.estimatedDelivery, history: o.history, createdAt: o.createdAt
});

// Público: envío fijo y ciudades con su tiempo de entrega. Única fuente: la bolsa y el pago leen esto.
router.get('/shipping', (_req, res) => res.json({ fee: SHIPPING_FEE, cities: CITIES, paymentMethods: PAYMENT_METHODS }));

// Público: rastreo con número de pedido + correo del pedido (los dos deben coincidir).
// Mismo mensaje si falla cualquiera de los dos: no revela si el número existe.
router.post(
  '/track',
  trackLimiter,
  asyncHandler(async (req, res) => {
    const code = text(req.body?.code).toUpperCase();
    const email = text(req.body?.email).toLowerCase();
    if (!CODE_RE.test(code)) throw new HttpError(400, 'El número de pedido tiene un formato como VOLT-1001.');
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Escribe el correo con el que hiciste el pedido.');
    const order = await Order.findOne({ code, customerEmail: email, archivedAt: null });
    if (!order) throw new HttpError(404, 'No encontramos un pedido con ese número y ese correo. Revisa tu confirmación de compra.');
    res.json(publicOrder(order));
  })
);

// Cliente con sesión: sus pedidos
router.get(
  '/mine',
  requireCustomer,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ customer: req.customer.id, archivedAt: null }).sort({ createdAt: -1 }).limit(50).select('code status total createdAt items');
    res.json(orders);
  })
);

// Cliente con sesión: UN pedido suyo (la confirmación de compra usa esta ruta, no el rastreo público)
router.get(
  '/mine/:code',
  requireCustomer,
  asyncHandler(async (req, res) => {
    const code = String(req.params.code).toUpperCase().trim();
    if (!CODE_RE.test(code)) throw new HttpError(400, 'El número de pedido tiene un formato como VOLT-1001.');
    const order = await Order.findOne({ code, customer: req.customer.id, archivedAt: null });
    if (!order) throw new HttpError(404, 'No encontramos ese pedido en tu cuenta.');
    res.json(publicOrder(order));
  })
);

/** Siguiente número de pedido, sin repetir aunque dos clientes compren a la vez. */
async function nextCode() {
  const c = await Counter.findOneAndUpdate({ _id: 'order' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `VOLT-${FIRST_REAL_ORDER + c.seq}`;
}

/**
 * Valida la bolsa contra la base de datos y calcula el total REAL (precio y stock por talla).
 * `name` que manda el navegador solo sirve para que el mensaje diga qué prenda falló; nunca se usa para cobrar.
 */
async function priceBag(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > 20) throw new HttpError(400, 'Tu bolsa está vacía.');

  // Une líneas repetidas (misma prenda y talla) y valida cada una
  const lines = new Map();
  for (const it of rawItems) {
    const productId = typeof it?.productId === 'string' ? it.productId : '';
    const size = text(it?.size);
    const qty = Number(it?.qty);
    const hint = text(it?.name).slice(0, 80) || 'Una prenda de tu bolsa';
    if (!mongoose.isValidObjectId(productId)) throw new HttpError(400, `"${hint}" no es válida.`);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) throw new HttpError(400, `La cantidad de "${hint}" debe estar entre 1 y 10.`);
    const k = `${productId}|${size}`;
    lines.set(k, { productId, size, qty: (lines.get(k)?.qty || 0) + qty, hint });
  }

  const ids = [...new Set([...lines.values()].map((l) => l.productId))];
  const products = await Product.find({ _id: { $in: ids }, active: true });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items = [];
  for (const l of lines.values()) {
    const p = byId.get(l.productId);
    if (!p) throw new HttpError(409, `"${l.hint}" ya no está disponible. Quítala de tu bolsa para continuar.`);
    if (p.price == null) throw new HttpError(409, `"${p.name}" todavía no tiene precio.`);
    const v = p.variants.find((x) => x.size === l.size);
    if (!l.size || !v) throw new HttpError(409, `La talla "${l.size || '—'}" de "${p.name}" ya no está disponible.`);
    if (v.stock < l.qty) {
      throw new HttpError(409, v.stock === 0 ? `"${p.name}" talla ${l.size} está agotada.` : `De "${p.name}" talla ${l.size} solo quedan ${v.stock} unidades.`);
    }
    items.push({ product: p._id, name: p.name, size: l.size, qty: l.qty, price: p.price });
  }
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  return { items, subtotal, shipping: SHIPPING_FEE, total: subtotal + SHIPPING_FEE };
}

// Cliente con sesión: precio real de la bolsa ANTES de pagar. Checkout lo compara con lo que muestra.
router.post(
  '/quote',
  requireCustomer,
  asyncHandler(async (req, res) => {
    const q = await priceBag(req.body?.items);
    res.json({
      subtotal: q.subtotal,
      shipping: q.shipping,
      total: q.total,
      items: q.items.map((i) => ({ productId: String(i.product), size: i.size, qty: i.qty, name: i.name, price: i.price }))
    });
  })
);

// Crear pedido (solo con sesión iniciada). El precio y el stock se toman SIEMPRE de la base de datos, nunca del navegador.
router.post(
  '/',
  buyLimiter,
  requireCustomer, // comprar exige una cuenta: iniciar sesión o crearla
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const name = text(b.name), email = text(b.email).toLowerCase(), phone = text(b.phone).replace(/[\s()-]/g, '');
    const address = text(b.address), notes = text(b.notes), city = text(b.city), paymentMethod = text(b.paymentMethod);

    if (name.length < 2) throw new HttpError(400, 'Escribe tu nombre.');
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'El correo no tiene un formato válido.');
    if (!/^\+?\d{7,15}$/.test(phone)) throw new HttpError(400, 'Escribe un teléfono válido (solo números).');
    if (!CITIES.some((c) => c.name === city)) throw new HttpError(400, 'Elige una ciudad de la lista.');
    if (address.length < 6) throw new HttpError(400, 'Escribe tu dirección completa.');
    if (!PAYMENT_METHODS.includes(paymentMethod)) throw new HttpError(400, 'Elige un medio de pago.');
    if (b.acceptTerms !== true) throw new HttpError(400, 'Debes aceptar los términos y condiciones para comprar.');

    const priced = await priceBag(b.items);
    // Si el total que vio el cliente ya no es el real (cambió un precio), no se cobra: se le avisa
    if (b.expectedTotal !== undefined && Number(b.expectedTotal) !== priced.total) {
      throw new HttpError(409, 'El total de tu bolsa cambió. Revisa los valores actualizados antes de pagar.');
    }

    // Descuenta el stock de esa talla al crear el pedido, de forma atómica; si algo falla, devuelve lo descontado
    const taken = [];
    try {
      for (const it of priced.items) {
        const r = await Product.updateOne(
          { _id: it.product, variants: { $elemMatch: { size: it.size, stock: { $gte: it.qty } } } },
          { $inc: { 'variants.$.stock': -it.qty } }
        );
        if (r.modifiedCount !== 1) throw new HttpError(409, `Alguien compró "${it.name}" talla ${it.size} justo antes que tú y ya no hay suficiente stock.`);
        taken.push(it);
      }
      const now = new Date();
      const order = await Order.create({
        code: await nextCode(),
        status: 'Pago confirmado', // la pasarela de este sitio es simulada y aprueba el pago
        customer: req.customer.id,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        city,
        address,
        notes,
        paymentMethod,
        items: priced.items,
        shipping: priced.shipping,
        total: priced.total,
        estimatedDelivery: estimateDelivery(city),
        acceptedTermsAt: now,
        termsVersion: TERMS_VERSION,
        history: [{ status: 'Pago confirmado', at: now }]
      });
      res.status(201).json({ code: order.code, status: order.status, total: order.total });
    } catch (err) {
      for (const it of taken) await restock(it);
      throw err;
    }
  })
);

/** Devuelve al inventario una línea del pedido (talla exacta). */
const restock = (it) =>
  it.product
    ? Product.updateOne({ _id: it.product, 'variants.size': it.size }, { $inc: { 'variants.$.stock': it.qty } }).catch(() => {})
    : Promise.resolve();

// Admin: lista de pedidos (los archivados no salen)
router.get(
  '/',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    res.json(await Order.find({ archivedAt: null }).sort({ createdAt: -1 }).limit(200));
  })
);

// Admin: cambiar el estado. Reglas:
//  - solo se avanza (no se retrocede ni se salta hacia atrás);
//  - "Entregado" y "Cancelado" son finales;
//  - cancelar solo es posible antes del despacho (Pago confirmado, En preparación, Empacado);
//  - el cambio es UNA operación atómica sobre el estado anterior: si dos personas lo piden a la vez, solo una gana,
//    y por eso el stock se repone una sola vez.
router.patch(
  '/:code/status',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, `Estado no válido. Usa uno de: ${ORDER_STATUSES.join(', ')}.`);
    const code = String(req.params.code).toUpperCase();

    const allowedFrom = status === 'Cancelado' ? CANCELABLE : FLOW.slice(0, FLOW.indexOf(status)).filter((s) => s !== 'Entregado');
    const updated = await Order.findOneAndUpdate(
      { code, archivedAt: null, status: { $in: allowedFrom } },
      { $set: { status }, $push: { history: { status, at: new Date() } } },
      { new: true }
    );

    if (!updated) {
      const current = await Order.findOne({ code, archivedAt: null }).select('status');
      if (!current) throw new HttpError(404, 'El pedido no existe.');
      if (current.status === 'Cancelado') throw new HttpError(409, 'Un pedido cancelado ya no se puede cambiar.');
      if (current.status === 'Entregado') throw new HttpError(409, 'Un pedido entregado ya no se puede cambiar.');
      if (status === 'Cancelado') throw new HttpError(409, `Ya no se puede cancelar: el pedido está "${current.status}". La cancelación solo es posible antes del despacho.`);
      throw new HttpError(409, `No se puede pasar de "${current.status}" a "${status}". Los estados solo avanzan.`);
    }

    if (status === 'Cancelado') for (const it of updated.items) await restock(it); // solo gana UNA petición, así que no se duplica
    res.json(updated);
  })
);

// Admin: "borrar" un pedido lo ARCHIVA (no se elimina: queda el rastro). Si seguía en curso, se cancela y se repone el stock.
router.delete(
  '/:code',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const code = String(req.params.code).toUpperCase();
    const now = new Date();
    // Si todavía se podía cancelar, se cancela de forma atómica (y se repone el stock una sola vez)
    const cancelled = await Order.findOneAndUpdate(
      { code, archivedAt: null, status: { $in: CANCELABLE } },
      { $set: { status: 'Cancelado', archivedAt: now }, $push: { history: { status: 'Cancelado', at: now } } },
      { new: true }
    );
    if (cancelled) {
      for (const it of cancelled.items) await restock(it);
      return res.json({ ok: true, code, archived: true, restocked: true });
    }
    const archived = await Order.findOneAndUpdate({ code, archivedAt: null }, { $set: { archivedAt: now } }, { new: true });
    if (!archived) throw new HttpError(404, 'El pedido no existe.');
    res.json({ ok: true, code, archived: true, restocked: false });
  })
);

export default router;
