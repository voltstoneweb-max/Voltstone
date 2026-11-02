import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import contactRoutes from './routes/contact.js';
import aiRoutes from './routes/ai.js';

const app = express();
app.set('trust proxy', 1); // necesario detrás del proxy de Render para el rate limit

app.use(helmet());
const origins = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: origins })); // solo los orígenes del frontend (si la lista está vacía, el servidor ni arranca: ver abajo)
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true })); // útil para "despertar" Render
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 4000;
try {
  // Falla cerrada: es mejor no arrancar que arrancar inseguro
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres (usa una cadena larga y aleatoria)');
  if (!origins.length) throw new Error('Falta CLIENT_ORIGIN en server/.env (dominios permitidos por CORS)');
  await connectDB(process.env.MONGODB_URI);
  app.listen(port, () => console.log(`API lista en http://localhost:${port}`));
} catch (err) {
  console.error('No se pudo iniciar el servidor:', err.message);
  process.exit(1);
}
