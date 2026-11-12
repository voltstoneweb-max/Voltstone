import { useState } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { Spinner } from './Loader.jsx';
import ErrorBox from './ErrorBox.jsx';

const EMAIL_RE = /^[^\s@?]+@[^\s@?]+\.[^\s@?]+$/;

/** Preguntas y respuestas de una prenda (como en Mercado Libre): se ven solo las ya respondidas por el vendedor. */
export default function ProductQA({ productId }) {
  const { data, loading, error, reload } = useApi(() => request(`/questions?product=${productId}`), [productId]);
  const [form, setForm] = useState({ name: '', email: '', question: '', acceptDataPolicy: false });
  const [status, setStatus] = useState({ type: 'idle', msg: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function ask(e) {
    e.preventDefault();
    if (form.name.trim().length < 2) return setStatus({ type: 'error', msg: 'Escribe tu nombre.' });
    if (!EMAIL_RE.test(form.email)) return setStatus({ type: 'error', msg: 'Escribe un correo válido.' });
    if (form.question.trim().length < 10) return setStatus({ type: 'error', msg: 'Cuéntanos tu pregunta con un poco más de detalle (mínimo 10 caracteres).' });
    if (!form.acceptDataPolicy) return setStatus({ type: 'error', msg: 'Debes autorizar el tratamiento de tus datos para enviar la pregunta.' });
    setStatus({ type: 'loading', msg: '' });
    try {
      await request('/questions', { method: 'POST', body: { productId, ...form } });
      setForm({ name: '', email: '', question: '', acceptDataPolicy: false });
      setStatus({ type: 'ok', msg: 'Recibimos tu pregunta. Cuando el vendedor la responda aparecerá aquí.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    }
  }

  return (
    <div className="qa-wrap">
      <h2 className="qa-title">Preguntas y respuestas</h2>
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
        <label className="check">
          <input type="checkbox" checked={form.acceptDataPolicy} onChange={set('acceptDataPolicy')} />{' '}
          <span>Autorizo el tratamiento de mis datos personales para gestionar esta pregunta, según la <Link className="link" to="/info/privacidad" target="_blank">política de privacidad</Link>.</span>
        </label>
        <button className="btn" disabled={status.type === 'loading'}>{status.type === 'loading' ? 'Enviando…' : 'Enviar pregunta'}</button>
        {status.type === 'ok' && <div className="alert alert-ok" role="status">{status.msg}</div>}
        {status.type === 'error' && <div className="alert alert-error" role="alert">{status.msg}</div>}
      </form>
    </div>
  );
}
