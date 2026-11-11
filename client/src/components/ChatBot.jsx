import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { request } from '../api.js';

/** VoltBot: chatbot que consulta POST /api/ai/chat (el backend inyecta marca, políticas y catálogo). */
export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: 'bot', text: 'Hola, soy VoltBot. Pregúntame por prendas, tallas, envíos o devoluciones.' }]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  // Importante: las llaves evitan que el efecto devuelva el resultado de scrollIntoView
  // (React espera que un efecto devuelva solo una función de limpieza o nada: eso causaba "destroy is not a function").
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, busy]);

  // Permite abrir el chat desde otras partes de la página (por ejemplo, el Centro de ayuda)
  useEffect(() => {
    const open = () => setOpen(true);
    window.addEventListener('voltbot:open', open);
    return () => window.removeEventListener('voltbot:open', open);
  }, []);

  async function send(e) {
    e.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    setText('');
    setMsgs((m) => [...m, { role: 'user', text: message }]);
    setBusy(true);
    try {
      // Se envía el historial reciente (sin el saludo inicial) para dar contexto a la IA
      const history = msgs.slice(1).map(({ role, text }) => ({ role, text }));
      const { reply } = await request('/ai/chat', { method: 'POST', body: { message, history } });
      setMsgs((m) => [...m, { role: 'bot', text: reply }]);
    } catch (err) {
      setMsgs((m) => [...m, { role: 'bot', text: err.message, error: true }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Abrir VoltBot">
        {open ? '✕' : 'VoltBot'}
      </button>
      <AnimatePresence>
        {open && (
          <motion.section
            className="chat"
            aria-label="Chat con VoltBot"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
          >
            <div className="chat-log" aria-live="polite">
              {msgs.map((m, i) => (
                <p key={i} className={`bubble ${m.role} ${m.error ? 'err' : ''}`}>{m.text}</p>
              ))}
              {busy && <p className="bubble bot">Escribiendo…</p>}
              <div ref={endRef} />
            </div>
            <form className="chat-form" onSubmit={send}>
              <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Escribe tu pregunta" aria-label="Tu pregunta" />
              <button className="btn" disabled={busy || !text.trim()}>Enviar</button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
