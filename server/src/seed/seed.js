/**
 * Carga datos iniciales: el catálogo maestro (166 prendas) y el administrador único.
 * Uso: npm run seed   (borra y recrea los productos, el admin y los pedidos de ejemplo; no toca los mensajes ni las cuentas)
 *      npm run seed -- --yes   (sin pedir confirmación)
 */
import 'dotenv/config';
import readline from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';
import Order from '../models/Order.js';
import Counter from '../models/Counter.js';
import { CATALOG } from '../data/catalog.js';

// Stock por talla, igual para todas las prendas hasta que se ajuste desde el panel (sin números al azar)
const STOCK_BY_SIZE = { S: 6, M: 10, L: 8, XL: 3 };
const variantsFor = (p) => (p.category === 'Accesorios textiles' ? [{ size: 'Talla única', stock: 25 }] : Object.entries(STOCK_BY_SIZE).map(([size, stock]) => ({ size, stock })));

// Galería de la página de producto: la foto principal más las fotos extra que existan para la misma prenda
const EXTRA_PHOTOS = {
  'img/productos/leggings-deportivos-frente.jpg': ['img/productos/leggings-deportivos-espalda.jpg'],
  'img/productos/chaqueta-ligera-negro.jpg': ['img/productos/chaqueta-ligera-azul.jpg']
};
const galleryFor = (p) => (p.imageUrl ? [p.imageUrl, ...(EXTRA_PHOTOS[p.imageUrl] || [])] : []);

// Catálogo maestro completo: conserva los precios del catálogo y completa tallas y stock por talla (se ajustan desde el panel de administración)
const products = CATALOG.map((p) => ({
  ...p,
  price: p.price ?? null,
  variants: variantsFor(p),
  sizes: variantsFor(p).map((v) => v.size),
  colors: p.colors || [],
  description: p.description || '',
  images: galleryFor(p)
}));

// Pedidos de ejemplo para probar el rastreo (VOLT-1001, VOLT-1002 y VOLT-1003; para rastrearlos se necesita también su correo de ejemplo)
const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const inDays = (n) => new Date(Date.now() + n * 86400000);
const demoOrders = [
  { code: 'VOLT-1001', status: 'En camino', customerName: 'Camila R.', customerEmail: 'camila.demo@example.com', city: 'Bogotá', paymentMethod: 'Tarjeta', items: [{ name: 'Camiseta básica', size: 'M', qty: 2, price: 69900 }, { name: 'Pantalón cargo', size: 'L', qty: 1, price: 169900 }], total: 319700, estimatedDelivery: inDays(2), history: [['Pago confirmado', 4], ['En preparación', 3], ['Empacado', 2], ['Entregado a la transportadora', 1], ['En camino', 1]] },
  { code: 'VOLT-1002', status: 'En preparación', customerName: 'Andrés M.', customerEmail: 'andres.demo@example.com', city: 'Cali', paymentMethod: 'PSE', items: [{ name: 'Chaqueta coach', size: 'L', qty: 1, price: 219900 }], total: 229900, estimatedDelivery: inDays(1), history: [['Pago confirmado', 1], ['En preparación', 0]] },
  { code: 'VOLT-1003', status: 'Entregado', customerName: 'Laura P.', customerEmail: 'laura.demo@example.com', city: 'Medellín', paymentMethod: 'Tarjeta', items: [{ name: 'Polo Piqué', size: 'S', qty: 1, price: 119900 }], total: 129900, estimatedDelivery: daysAgo(2), history: [['Pago confirmado', 8], ['En preparación', 7], ['Empacado', 6], ['Entregado a la transportadora', 5], ['En camino', 4], ['Entregado', 2]] }
].map(({ history, ...o }) => ({ ...o, shipping: 10000, history: history.map(([status, d]) => ({ status, at: daysAgo(d) })) }));

try {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGODB_URI) throw new Error('Falta MONGODB_URI en server/.env');
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Faltan ADMIN_EMAIL y ADMIN_PASSWORD en server/.env');
  if (ADMIN_PASSWORD.length < 10) throw new Error('ADMIN_PASSWORD debe tener al menos 10 caracteres');

  // Confirmación: este script BORRA productos y admin. Solo se muestra el servidor, nunca la clave.
  if (!process.argv.includes('--yes')) {
    const host = MONGODB_URI.replace(/^mongodb(\+srv)?:\/\/[^@]*@/, '').split(/[/?]/)[0];
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`Esto BORRA los productos, el admin y los pedidos de ejemplo en ${host}. Escribe SI para continuar: `);
    rl.close();
    if (answer.trim().toUpperCase() !== 'SI') {
      console.log('Cancelado. No se tocó nada.');
      process.exit(0);
    }
  }

  // Seguridad: valida TODOS los productos antes de borrar nada, para no dejar la tienda vacía si algún dato está mal
  for (const p of products) {
    const invalid = new Product(p).validateSync();
    if (invalid) throw new Error(`El producto ${p.sku} no es válido: ${invalid.message}`);
  }

  await connectDB(MONGODB_URI);
  await Product.deleteMany({});
  await Product.insertMany(products);
  await Order.deleteMany({});
  await Counter.deleteMany({}); // la numeración real vuelve a empezar en VOLT-1004
  await Order.insertMany(demoOrders);
  await Admin.deleteMany({}); // un único administrador
  await Admin.create({ email: ADMIN_EMAIL, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10) });
  console.log(`Listo: ${products.length} productos, ${demoOrders.length} pedidos de ejemplo y administrador ${ADMIN_EMAIL}`);
} catch (err) {
  console.error('Error en el seed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}