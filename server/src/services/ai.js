import Product from '../models/Product.js';
import { BRAND } from '../data/brand.js';
import { HttpError } from '../middleware/errors.js';

const cop = (n) => '$' + Number(n).toLocaleString('es-CO');

/** Arma el "system prompt": marca + políticas + catálogo REAL leído de la base de datos. */
export async function buildSystemPrompt() {
  const products = await Product.find({ active: true });
  const catalog = products
    .map((p) => `- ${p.name} (${p.gender}) · ${cop(p.price)} · tallas ${p.sizes.join('/')} · colores ${p.colors.join(', ') || 'consultar'} · ${p.stock > 0 ? 'disponible' : 'agotado'}`)
    .join('\n');
  return [
    `Eres VoltBot, el asistente de ${BRAND.name}. Slogan: "${BRAND.slogan}".`,
    `Tono: ${BRAND.tone}`,
    `Sobre la empresa: ${BRAND.about}`,
    `Políticas:\n${BRAND.policies.map((p) => '- ' + p).join('\n')}`,
    `Contacto: ${BRAND.contact}`,
    `Catálogo actual:\n${catalog || '(sin productos cargados)'}`,
    'Reglas: responde como si fueras el negocio, en máximo 4 frases. Usa SOLO la información anterior; si algo no está, di que no lo sabes y ofrece el contacto. No inventes precios, tallas ni promociones. Si piden ayuda para elegir prenda, haz una recomendación concreta del catálogo.'
  ].join('\n\n');
}

// Tope diario global de llamadas a Gemini: protege tu cuota gratuita aunque lleguen muchas IPs.
// Vive en memoria: se reinicia cuando Render reinicia el servicio (suficiente para este proyecto).
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT || 200);
let usage = { day: '', count: 0 };
function checkDailyCap() {
  const today = new Date().toISOString().slice(0, 10);
  if (usage.day !== today) usage = { day: today, count: 0 };
  if (usage.count >= DAILY_LIMIT) throw new HttpError(429, 'VoltBot alcanzó su límite de consultas de hoy. Escríbenos por el formulario de contacto.');
  usage.count += 1;
}

/** Llama a Gemini por REST (sin SDK). La clave vive solo en el servidor. */
async function callGemini(system, contents, maxOutputTokens = 400) {
  checkDailyCap();
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.6, maxOutputTokens }
    })
  });
  if (!res.ok) {
    console.error('Gemini error', res.status, await res.text());
    throw new HttpError(502, 'La IA no está disponible en este momento. Intenta de nuevo en un momento.');
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!text) throw new HttpError(502, 'La IA no devolvió una respuesta. Intenta reformular tu pregunta.');
  return text.trim();
}

/** Respuesta sin IA (si no hay clave): permite probar y defender el proyecto sin costo. */
async function fallbackReply(message) {
  const q = message.toLowerCase();
  if (/(env[ií]o|entrega|demora|cu[aá]nto tarda)/.test(q)) return BRAND.policies[1] + ' ' + BRAND.policies[2];
  if (/(devol|retract|cambio|garant|reembols)/.test(q)) return BRAND.policies.slice(4, 8).join(' ');
  if (/(contact|tel[eé]fono|correo)/.test(q)) return BRAND.contact;
  const products = await Product.find({ active: true }).limit(8);
  return 'Estas son nuestras prendas: ' + products.map((p) => `${p.name} ${cop(p.price)}`).join('; ') + '.';
}

export async function chat(message, history = []) {
  if (!process.env.GEMINI_API_KEY) return fallbackReply(message);
  const contents = [
    ...history
      .filter((h) => h && typeof h.text === 'string')
      .map((h) => ({ role: h.role === 'bot' ? 'model' : 'user', parts: [{ text: h.text.slice(0, 500) }] })),
    { role: 'user', parts: [{ text: message }] }
  ];
  return callGemini(await buildSystemPrompt(), contents);
}

const KINDS = {
  descripcion: 'una descripción de producto de 2 a 3 frases, lista para publicar en la tienda',
  instagram: 'un texto corto para Instagram (máximo 280 caracteres) con 3 hashtags, listo para publicar',
  correo: 'un correo breve de anuncio para clientes, con asunto y cuerpo, listo para enviar'
};

/** Genera textos de marketing listos para usar, en el tono de la marca. */
export async function generateText({ name, category, gender, kind = 'descripcion' }) {
  if (!process.env.GEMINI_API_KEY) throw new HttpError(503, 'Falta GEMINI_API_KEY en server/.env para generar textos.');
  const prompt = `Escribe ${KINDS[kind] || KINDS.descripcion} para esta prenda: ${name} (${category}, ${gender}). Devuelve solo el texto final.`;
  return callGemini(await buildSystemPrompt(), [{ role: 'user', parts: [{ text: prompt }] }], 500);
}
