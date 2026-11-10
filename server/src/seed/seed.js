/**
 * Carga datos iniciales: el catálogo maestro (166 prendas) y el administrador único.
 * Uso: npm run seed   (borra y recrea los productos y el admin; no toca los mensajes)
 *      npm run seed -- --yes   (sin pedir confirmación)
 */
import 'dotenv/config';
import readline from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';
import { CATALOG } from '../data/catalog.js';

// Catálogo maestro completo (sin precios: se completan desde el panel de administración)
const products = CATALOG.map((p) => ({ ...p, price: null, stock: null, sizes: [], colors: [], description: '' }));

try {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGODB_URI) throw new Error('Falta MONGODB_URI en server/.env');
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Faltan ADMIN_EMAIL y ADMIN_PASSWORD en server/.env');
  if (ADMIN_PASSWORD.length < 10) throw new Error('ADMIN_PASSWORD debe tener al menos 10 caracteres');

  // Confirmación: este script BORRA productos y admin. Solo se muestra el servidor, nunca la clave.
  if (!process.argv.includes('--yes')) {
    const host = MONGODB_URI.replace(/^mongodb(\+srv)?:\/\/[^@]*@/, '').split(/[/?]/)[0];
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`Esto BORRA los productos y el admin en ${host}. Escribe SI para continuar: `);
    rl.close();
    if (answer.trim().toUpperCase() !== 'SI') {
      console.log('Cancelado. No se tocó nada.');
      process.exit(0);
    }
  }

  await connectDB(MONGODB_URI);
  await Product.deleteMany({});
  await Product.insertMany(products);
  await Admin.deleteMany({}); // un único administrador
  await Admin.create({ email: ADMIN_EMAIL, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10) });
  console.log(`Listo: ${products.length} productos y administrador ${ADMIN_EMAIL}`);
} catch (err) {
  console.error('Error en el seed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
