import mongoose from 'mongoose';

/** Administrador único. Solo se guarda el hash de la clave, nunca la clave. */
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true }
});

export default mongoose.model('Admin', adminSchema);
