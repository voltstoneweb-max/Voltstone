import mongoose from 'mongoose';

// Mismos estados definidos para el pedido en toda la documentación
export const ORDER_STATUSES = ['Pendiente', 'Pagado', 'En preparación', 'Empacado', 'Enviado', 'Entregado', 'Cancelado'];
export const PAYMENT_METHODS = ['Tarjeta', 'PSE', 'Contra entrega'];

/** Pedido. El código (ej. VOLT-1001) es el número que el cliente usa para rastrearlo. */
const orderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pendiente' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // solo si compró con sesión iniciada
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
    history: [{ status: { type: String, enum: ORDER_STATUSES }, at: { type: Date, default: Date.now } }]
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
