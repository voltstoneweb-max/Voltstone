import mongoose from 'mongoose';

/** Contador para numerar los pedidos sin repetir números (VOLT-1004, VOLT-1005...). */
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });

export default mongoose.model('Counter', counterSchema);
