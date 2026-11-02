/**
 * Carga datos iniciales: 8 productos (4 prendas × hombre/mujer) y el administrador único.
 * Uso: npm run seed   (borra y recrea los productos y el admin; no toca los mensajes)
 *      npm run seed -- --yes   (sin pedir confirmación)
 * OJO: los precios son PROVISIONALES. Reemplázalos con los de VOLTSTONE_02_Catalogo_Maestro_v3.
 */
import 'dotenv/config';
import readline from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';

const base = [
  { code: 'CAM', name: 'Camiseta Oversized', category: 'camiseta', price: 89900, colors: ['Negro', 'Blanco', 'Amarillo'], description: 'Corte holgado en tela fresca para clima cálido.' },
  { code: 'POL', name: 'Polo Piqué', category: 'polo', price: 109900, colors: ['Negro', 'Gris', 'Blanco'], description: 'Polo de piqué que respira y mantiene la forma.' },
  { code: 'CAR', name: 'Pantalón Cargo Utility', category: 'pantalon', price: 169900, colors: ['Negro', 'Verde oliva'], description: 'Cargo con bolsillos funcionales y caída urbana.' },
  { code: 'COA', name: 'Chaqueta Coach', category: 'chaqueta', price: 219900, colors: ['Negro', 'Amarillo'], description: 'Chaqueta ligera tipo coach para noches templadas.' }
];

const products = base.flatMap((b) =>
  [['hombre', 'H'], ['mujer', 'M']].map(([gender, g]) => ({
    sku: `${b.code}-${g}`,
    name: `${b.name} ${gender === 'hombre' ? 'Hombre' : 'Mujer'}`,
    category: b.category,
    gender,
    price: b.price,
    colors: b.colors,
    description: b.description,
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 24
  }))
);

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
