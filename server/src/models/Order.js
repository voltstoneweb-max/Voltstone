import mongoose from 'mongoose';

// Estados del pedido, en orden. Solo se avanza hacia la derecha; "Cancelado" es aparte.
export const ORDER_STATUSES = ['Pago confirmado', 'En preparación', 'Empacado', 'Entregado a la transportadora', 'En camino', 'Entregado', 'Cancelado'];
export const FLOW = ORDER_STATUSES.slice(0, 6); // sin "Cancelado"
// Se puede cancelar solo ANTES del despacho (antes de entregarlo a la transportadora)
export const CANCELABLE = ['Pago confirmado', 'En preparación', 'Empacado'];
export const PAYMENT_METHODS = ['Tarjeta', 'PSE'];
export const TERMS_VERSION = '2026-11'; // sube este valor cuando cambien los términos

/** Pedido. El código (ej. VOLT-1001) es el número que el cliente usa para rastrearlo (junto con su correo). */
const orderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pago confirmado' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // el pedido siempre pertenece a una cuenta
    customerName: { type: String, required: true, trim: true, maxlength: 80 },
    customerEmail: { type: String, default: '', trim: true, lowercase: true, maxlength: 120 },
    customerPhone: { type: String, default: '', trim: true, maxlength: 20 },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    address: { type: String, default: '', trim: true, maxlength: 160 },
    notes: { type: String, default: '', trim: true, maxlength: 300 },
    paymentMethod: { type: String, enum: [...PAYMENT_METHODS, ''], default: '' },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        size: { type: String, default: '' },
        qty: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 }
      }
    ],
    shipping: { type: Number, default: 10000 },
    total: { type: Number, required: true, min: 0 },
    estimatedDelivery: { type: Date },
    acceptedTermsAt: { type: Date }, // cuándo aceptó los términos al pagar
    termsVersion: { type: String, default: '' },
    archivedAt: { type: Date, default: null }, // "borrar" un pedido lo archiva; no se elimina
    history: [{ status: { type: String, enum: ORDER_STATUSES }, at: { type: Date, default: Date.now } }]
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
