import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { cop, genderText, swatch } from '../utils/format.js';
import { Spinner } from './Loader.jsx';
import ErrorBox from './ErrorBox.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Detalle del producto con "Preguntas y respuestas" (como en Mercado Libre):
 * se ven solo las preguntas que el vendedor ya respondió; la tuya queda pendiente hasta que se responda.
 */
export default function ProductModal({ p, onClose }) {
  const { data, loading, error, reload } = useApi(() => request(`/questions?product=${p._id}`), [p._id]);
  const [form, setForm] = useState({ name: '', email: '', question: '' });
  const [status, setStatus] = useState({ type: 'idle', msg: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Esc cierra la ventana
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function ask(e) {
    e.preventDefault();
    if (form.name.trim().length < 2) return setStatus({ type: 'error', msg: 'Escribe tu nombre.' });
    if (!EMAIL_RE.test(form.email)) return setStatus({ type: 'error', msg: 'Escribe un correo válido para avisarte la respuesta.' });
    if (form.question.trim().length < 10) return setStatus({ type: 'error', msg: 'Cuéntanos tu pregunta con un poco más de detalle (mínimo 10 caracteres).' });
    setStatus({ type: 'loading', msg: '' });
    try {
      await request('/questions', { method: 'POST', body: { productId: p._id, ...form } });
      setForm({ name: '', email: '', question: '' });
      setStatus({ type: 'ok', msg: 'Recibimos tu pregunta. Cuando el vendedor la responda aparecerá aquí.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={p.name} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        <p className="product-meta">{p.category} · {genderText(p.genders)} · {p.sku}</p>
        <h2>{p.name}</h2>
        <p className={p.price == null ? 'product-price pending' : 'product-price'}>
          {cop(p.price)} {p.price != null && <small>IVA incluido</small>}
        </p>
        {p.description && <p className="product-desc">{p.description}</p>}
        <dl className="specs">
          <div><dt>Materiales</dt><dd className="chips">{p.materials.length ? p.materials.map((m) => <span key={m}>{m}</span>) : 'Por confirmar'}</dd></div>
          <div><dt>Tallas</dt><dd className="chips">{p.sizes.length ? p.sizes.map((s) => <span key={s}>{s}</span>) : 'Por confirmar'}</dd></div>
          {p.colors.length > 0 && <div><dt>Colores</dt><dd className="colors">{p.colors.map((c) => <span key={c}><i style={{ background: swatch(c) }} />{c}</span>)}</dd></div>}
          <div><dt>Stock</dt><dd>{p.stock == null ? 'Por confirmar' : `${p.stock} unidades`}</dd></div>
        </dl>

        <h3 className="qa-title">Preguntas y respuestas</h3>
        {loading && <Spinner label="Cargando preguntas…" />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        {data && data.length === 0 && <p className="muted">Todavía no hay preguntas respondidas. ¡Sé el primero en preguntar!</p>}
        {data?.map((q) => (
          <div key={q._id} className="qa">
            <p className="qa-q">{q.question}</p>
            <p className="qa-a">↳ {q.answer}</p>
          </div>
        ))}

        <form onSubmit={ask} noValidate className="qa-form">
          <h3 className="qa-title">Preguntarle al vendedor</h3>
          <label className="field"><span>Tu pregunta</span><textarea rows="3" maxLength={300} value={form.question} onChange={set('question')} placeholder="Ej.: ¿Qué tallas hay disponibles?" /></label>
          <div className="two">
            <label className="field"><span>Nombre</span><input maxLength={40} value={form.name} onChange={set('name')} /></label>
            <label className="field"><span>Correo (no se publica)</span><input type="email" maxLength={120} value={form.email} onChange={set('email')} /></label>
          </div>
          <button className="btn" disabled={status.type === 'loading'}>{status.type === 'loading' ? 'Enviando…' : 'Enviar pregunta'}</button>
          {status.type === 'ok' && <div className="alert alert-ok" role="status">{status.msg}</div>}
          {status.type === 'error' && <div className="alert alert-error" role="alert">{status.msg}</div>}
        </form>
        <p className="muted small">¿Un tema de pedido, devolución o garantía? Ve al <Link className="link" to="/ayuda" onClick={onClose}>Centro de ayuda</Link>.</p>
      </section>
    </div>
  );
}
