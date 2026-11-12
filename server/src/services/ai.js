import Product from '../models/Product.js';
import { BRAND } from '../data/brand.js';
import { HttpError } from '../middleware/errors.js';

const cop = (n) => '$' + Number(n).toLocaleString('es-CO');

/** Arma el "system prompt": marca + políticas + catálogo REAL leído de la base de datos. */
export async function buildSystemPrompt() {
  const products = await Product.find({ active: true });
  // Catálogo agrupado por categoría (solo nombres: así el prompt se mantiene corto con 166 prendas)
  const byCat = {};
  for (const p of products) (byCat[p.category] ||= []).push(p.genders.length === 1 ? `${p.name} (${p.genders[0]})` : p.name);
  const catalog = Object.entries(byCat).map(([c, list]) => `- ${c}: ${list.join(', ')}`).join('\n');
  return [
    `Eres VoltBot, el asistente de ${BRAND.name}. Slogan: "${BRAND.slogan}".`,
    `Tono: ${BRAND.tone}`,
    `Sobre la empresa: ${BRAND.about}`,
    `Políticas:\n${BRAND.policies.map((p) => '- ' + p).join('\n')}`,
    `Contacto: ${BRAND.contact}`,
    `Catálogo actual:\n${catalog || '(sin productos cargados)'}`,
    'Reglas: responde como si fueras el negocio, en máximo 4 frases. Usa SOLO la información anterior; si algo no está, di que no lo sabes y ofrece el contacto. No inventes precios, tallas ni promociones. Si piden ayuda para elegir prenda, recomienda prendas del catálogo según su clima y uso. Los precios, tallas y disponibilidad de cada prenda se están confirmando: si preguntan, indica que revisen el detalle del producto o escriban al Centro de ayuda.'
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

// Modelos a probar en orden: primero el configurado en GEMINI_MODEL (Render) y luego respaldos
const MODELS = [...new Set([process.env.GEMINI_MODEL, 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'].filter(Boolean))];

/** Llama a Gemini por REST (sin SDK). La clave vive solo en el servidor. Si un modelo falla, prueba el siguiente. */
async function callGemini(system, contents, maxOutputTokens = 400) {
  checkDailyCap();
  for (const model of MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
        if (text) return text.trim();
        console.error('Gemini sin texto', model, JSON.stringify(data).slice(0, 300));
        continue;
      }
      console.error('Gemini error', model, res.status, (await res.text()).slice(0, 400));
      if (res.status === 401 || res.status === 403) break; // clave inválida o sin permiso: otro modelo no ayuda
    } catch (err) {
      console.error('Gemini no respondió', model, err.message);
    }
  }
  throw new HttpError(502, 'La IA no está disponible en este momento. Intenta de nuevo en un momento.');
}

/** Respuesta sin IA (si no hay clave o la IA falla): VoltBot nunca se queda sin contestar. */
async function fallbackReply(message) {
  const q = message.toLowerCase().trim();
  if (/^(hola|buen[oa]s|hey|saludos|holi)/.test(q)) return '¡Hola! Soy VoltBot, el asistente de VOLTSTONE. Puedo ayudarte con prendas, tallas, envíos, cambios y garantía. ¿Qué necesitas?';
  if (/(env[ií]o|entrega|demora|cu[aá]nto tarda)/.test(q)) return BRAND.policies[1] + ' ' + BRAND.policies[2];
  if (/(devol|retract|cambio|garant|reembols)/.test(q)) return BRAND.policies.slice(4, 8).join(' ');
  if (/(contact|tel[eé]fono|correo)/.test(q)) return BRAND.contact;
  const cats = await Product.distinct('category', { active: true });
  return 'Nuestro catálogo tiene estas categorías: ' + cats.join(', ') + '. Mira el detalle de cada prenda en la sección Catálogo.';
}

export async function chat(message, history = []) {
  if (!process.env.GEMINI_API_KEY) return fallbackReply(message);
  const contents = [
    ...history
      .filter((h) => h && typeof h.text === 'string')
      .map((h) => ({ role: h.role === 'bot' ? 'model' : 'user', parts: [{ text: h.text.slice(0, 500) }] })),
    { role: 'user', parts: [{ text: message }] }
  ];
  try {
    return await callGemini(await buildSystemPrompt(), contents);
  } catch (err) {
    if (err instanceof HttpError && err.status === 429) throw err; // tope diario: se le avisa al cliente
    console.error('VoltBot respondió sin IA por:', err.message);
    return fallbackReply(message);
  }
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
