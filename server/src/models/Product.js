import mongoose from 'mongoose';

/**
 * Prenda del catálogo maestro. Casi todos los datos comerciales son opcionales:
 * el catálogo se publica completo aunque todavía no haya foto, precio, tallas o stock.
 */
const productSchema = new mongoose.Schema(
  {
    // Si no se envía, se genera uno (por ejemplo al crear una prenda desde el panel)
    sku: { type: String, unique: true, trim: true, default: () => 'VS-' + Date.now().toString(36).toUpperCase() },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    genders: { type: [{ type: String, enum: ['hombre', 'mujer'] }], default: ['hombre', 'mujer'] },
    materials: { type: [String], default: [] }, // materiales recomendados (del catálogo maestro)
    // Precio en COP entero con IVA incluido. null = "Precio por confirmar"
    price: {
      type: Number,
      min: 0,
      default: null,
      validate: { validator: (v) => v == null || Number.isInteger(v), message: 'El precio debe ser un número entero.' }
    },
    description: { type: String, default: '', maxlength: 600 },
    colors: { type: [String], default: [] },
    sizes: { type: [String], default: [] },
    stock: { type: Number, min: 0, default: null }, // null = por confirmar
    imageUrl: { type: String, default: '' },
    images: { type: [String], default: [] }, // galería de la página de producto (si está vacía se usa imageUrl)
    active: { type: Boolean, default: true }, // false = oculto en el catálogo público
    order: { type: Number, default: 9999 } // orden de aparición (las prendas nuevas van al final)
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
