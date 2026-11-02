import mongoose from 'mongoose';

/** Mensaje enviado desde el formulario de contacto (se guarda en la base de datos). */
const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
