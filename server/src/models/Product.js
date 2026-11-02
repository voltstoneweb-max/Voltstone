import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, trim: true }, // ej. CAM-H
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, required: true, enum: ['camiseta', 'polo', 'pantalon', 'chaqueta'] },
    gender: { type: String, required: true, enum: ['hombre', 'mujer'] },
    // Precio en COP, entero y con IVA incluido (política de precios de la empresa)
    price: { type: Number, required: true, min: 0, validate: { validator: Number.isInteger, message: 'El precio debe ser un número entero.' } },
    description: { type: String, default: '', maxlength: 600 },
    colors: { type: [String], default: [] },
    sizes: { type: [String], default: ['S', 'M', 'L', 'XL'] },
    stock: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String, default: '' },
    active: { type: Boolean, default: true } // false = oculto en el catálogo público
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
