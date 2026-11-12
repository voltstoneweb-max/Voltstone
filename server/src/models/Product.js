import mongoose from 'mongoose';

/**
 * Prenda del catálogo maestro. Casi todos los datos comerciales son opcionales:
 * el catálogo se publica completo aunque todavía no haya foto, precio o tallas.
 *
 * Stock POR TALLA: `variants` = [{ size: 'S', stock: 6 }, { size: 'M', stock: 10 }, ...].
 * `sizes` se deriva de `variants` (se mantiene para que el catálogo y los filtros sigan funcionando)
 * y `stock` es un campo calculado (suma de las tallas) que se envía en el JSON, pero NO se guarda.
 */
const variantSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true, maxlength: 20 },
    stock: { type: Number, required: true, min: 0, validate: { validator: Number.isInteger, message: 'El stock de cada talla debe ser un número entero.' } }
  },
  { _id: false }
);

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
    variants: {
      type: [variantSchema],
      default: [],
      validate: { validator: (v) => new Set(v.map((x) => x.size)).size === v.length, message: 'Hay tallas repetidas.' }
    },
    sizes: { type: [String], default: [] }, // derivado de variants (ver hook)
    imageUrl: { type: String, default: '' },
    images: { type: [String], default: [] }, // galería de la página de producto (si está vacía se usa imageUrl)
    active: { type: Boolean, default: true }, // false = oculto en el catálogo público
    order: { type: Number, default: 9999 } // orden de aparición (las prendas nuevas van al final)
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false }, toObject: { virtuals: true } }
);

// Stock total = suma de las tallas; null si todavía no hay tallas cargadas ("por confirmar")
productSchema.virtual('stock').get(function stockTotal() {
  return this.variants?.length ? this.variants.reduce((n, v) => n + v.stock, 0) : null;
});
productSchema.set('toJSON', { virtuals: true, versionKey: false, transform: (_doc, ret) => { delete ret.id; return ret; } });

// Mantiene `sizes` igual a las tallas de `variants`
productSchema.pre('validate', function syncSizes(next) {
  if (this.variants?.length) this.sizes = this.variants.map((v) => v.size);
  next();
});

/** Convierte "S:6, M:10, L:8" (o un objeto {S:6}) en variants. Devuelve null si el formato no es válido. */
export function parseVariants(input) {
  const pairs = typeof input === 'string'
    ? input.split(',').map((t) => t.trim()).filter(Boolean).map((t) => t.split(':').map((x) => x.trim()))
    : Object.entries(input || {});
  const out = [];
  for (const [size, qty] of pairs) {
    const n = Number(qty);
    if (!size || !Number.isInteger(n) || n < 0) return null;
    out.push({ size, stock: n });
  }
  return out;
}

export default mongoose.model('Product', productSchema);
