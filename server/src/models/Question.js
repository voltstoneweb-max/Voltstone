import mongoose from 'mongoose';

/** Pregunta pública sobre un producto (estilo "Preguntas y respuestas" de Mercado Libre). */
const questionSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 }, // nunca se muestra en público
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer: { type: String, default: '', maxlength: 600 }, // vacío = sin responder (no se publica)
    answeredAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model('Question', questionSchema);
