import mongoose from 'mongoose';

/** Conecta con MongoDB. Si falla, el servidor no arranca (mejor que quedar a medias). */
export async function connectDB(uri) {
  if (!uri) throw new Error('Falta MONGODB_URI en server/.env');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('MongoDB conectado');
}
