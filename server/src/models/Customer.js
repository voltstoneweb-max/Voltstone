import mongoose from 'mongoose';

/** Cliente de la tienda. Solo se guarda el hash de la clave y cuándo aceptó los términos y el tratamiento de datos. */
const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    passwordHash: { type: String, required: true },
    acceptedTermsAt: { type: Date, required: true },
    acceptedDataPolicyAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.model('Customer', customerSchema);
