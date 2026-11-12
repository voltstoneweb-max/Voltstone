import mongoose from 'mongoose';

export const REASONS = ['producto', 'pedido', 'devolucion', 'garantia', 'pagos', 'pqrs', 'otro'];

/** Caso de contacto (formulario del Centro de ayuda). Cada caso recibe un número para seguimiento. */
const messageSchema = new mongoose.Schema(
  {
    ticket: { type: String, unique: true, sparse: true }, // número de caso / radicado, ej. VS-2026-483920
    reason: { type: String, enum: REASONS, default: 'otro' },
    orderNumber: { type: String, default: '', trim: true, maxlength: 40 },
    productRef: { type: String, default: '', trim: true, maxlength: 80 },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    dataAuthorizedAt: { type: Date }, // cuándo autorizó el tratamiento de sus datos al enviar el formulario
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
