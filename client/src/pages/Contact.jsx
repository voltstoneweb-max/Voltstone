import { useState } from 'react';
import { request } from '../api.js';

const EMPTY = { name: '', email: '', subject: '', message: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida en el cliente (feedback inmediato); el servidor vuelve a validar por seguridad. */
function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Escribe tu nombre.';
  if (!EMAIL_RE.test(f.email)) e.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  if (f.subject.trim().length < 3) e.subject = 'Indica el asunto.';
  if (f.message.trim().length < 10) e.message = 'Cuéntanos un poco más (mínimo 10 caracteres).';
  return e;
}

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: 'idle', msg: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setStatus({ type: 'loading', msg: '' });
    try {
      await request('/contact', { method: 'POST', body: form });
      setForm(EMPTY);
      setStatus({ type: 'ok', msg: 'Recibimos tu mensaje. Te responderemos al correo que indicaste.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    }
  }

  const field = (k, label, props = {}) => (
    <label className="field">
      <span>{label}</span>
      {props.area ? <textarea rows="5" value={form[k]} onChange={set(k)} maxLength={2000} aria-invalid={!!errors[k]} /> : <input type={props.type || 'text'} value={form[k]} onChange={set(k)} maxLength={120} aria-invalid={!!errors[k]} />}
      {errors[k] && <small className="field-error">{errors[k]}</small>}
    </label>
  );

  return (
    <section className="section narrow">
      <h1>Contacto</h1>
      <p className="muted">Escríbenos por pedidos, tallas, cambios o cualquier duda. Para una respuesta rápida también puedes usar VoltBot.</p>
      <form onSubmit={submit} noValidate>
        {field('name', 'Nombre')}
        {field('email', 'Correo', { type: 'email' })}
        {field('subject', 'Asunto')}
        {field('message', 'Mensaje', { area: true })}
        <button className="btn" disabled={status.type === 'loading'}>{status.type === 'loading' ? 'Enviando…' : 'Enviar mensaje'}</button>
      </form>
      {status.type === 'ok' && <div className="alert alert-ok" role="status">{status.msg}</div>}
      {status.type === 'error' && <div className="alert alert-error" role="alert">{status.msg}</div>}
    </section>
  );
}
