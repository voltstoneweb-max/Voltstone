import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { request } from '../api.js';

const REASONS = [
  ['producto', 'Pregunta sobre un producto'],
  ['pedido', 'Estado de mi pedido'],
  ['devolucion', 'Devolución o cambio de talla'],
  ['garantia', 'Garantía por defecto de fabricación'],
  ['pagos', 'Pagos y facturación'],
  ['pqrs', 'Petición, queja o reclamo'],
  ['otro', 'Otro tema']
];
// Ayuda contextual según el motivo (como en los centros de ayuda de Amazon y Mercado Libre)
const HINTS = {
  pedido: 'Ten a la mano tu número de pedido.',
  devolucion: 'Tienes 5 días hábiles desde la entrega. La prenda debe estar sin uso, sin lavar y con etiquetas.',
  garantia: 'Cubre defectos de fabricación durante 30 días desde la entrega. Cuéntanos qué pasó con la prenda.',
  pqrs: 'Te daremos un número de radicado y responderemos en máximo 15 días hábiles.',
  producto: 'También puedes preguntar desde el detalle de cada prenda en el Catálogo.'
};
const NEEDS_ORDER = ['pedido', 'devolucion', 'garantia', 'pagos'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { name: '', email: '', orderNumber: '', productRef: '', message: '' };

export default function Contact() {
  const [params] = useSearchParams();
  const first = REASONS.some(([v]) => v === params.get('motivo')) ? params.get('motivo') : 'producto';
  const [reason, setReason] = useState(first);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: 'idle', msg: '' });
  const [ticket, setTicket] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  /** Valida en el navegador (respuesta inmediata); el servidor vuelve a validar por seguridad. */
  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Escribe tu nombre.';
    if (!EMAIL_RE.test(form.email)) e.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
    if (form.message.trim().length < 10) e.message = 'Cuéntanos un poco más (mínimo 10 caracteres).';
    return e;
  }

  async function submit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    setStatus({ type: 'loading', msg: '' });
    try {
      const body = { reason, name: form.name, email: form.email, message: form.message };
      if (NEEDS_ORDER.includes(reason)) body.orderNumber = form.orderNumber;
      if (reason === 'producto') body.productRef = form.productRef;
      const res = await request('/contact', { method: 'POST', body });
      setTicket(res.ticket);
      setForm(EMPTY);
      setStatus({ type: 'ok', msg: '' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    }
  }

  if (status.type === 'ok') {
    return (
      <section className="section narrow">
        <h1>Recibimos tu caso</h1>
        <div className="case-box" role="status">
          <span className="muted">Tu número de caso</span>
          <strong>{ticket}</strong>
        </div>
        <p>Guárdalo para hacer seguimiento. Te responderemos al correo que indicaste{reason === 'pqrs' ? ', en máximo 15 días hábiles' : ''}.</p>
        <div className="row"><button className="btn btn-ghost" onClick={() => setStatus({ type: 'idle', msg: '' })}>Abrir otro caso</button></div>
      </section>
    );
  }

  const field = (k, label, props = {}) => (
    <label className="field">
      <span>{label}</span>
      {props.area ? <textarea rows="5" value={form[k]} onChange={set(k)} maxLength={2000} aria-invalid={!!errors[k]} /> : <input type={props.type || 'text'} value={form[k]} onChange={set(k)} maxLength={props.max || 120} aria-invalid={!!errors[k]} placeholder={props.placeholder} />}
      {errors[k] && <small className="field-error">{errors[k]}</small>}
    </label>
  );

  return (
    <section className="section narrow">
      <h1>Contacto</h1>
      <p className="muted">Elige el motivo y te llevamos al camino más rápido. Cada caso recibe un número de seguimiento.</p>
      <form onSubmit={submit} noValidate>
        <label className="field">
          <span>¿Sobre qué es tu consulta?</span>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
          {HINTS[reason] && <small className="hint">{HINTS[reason]}</small>}
        </label>
        {NEEDS_ORDER.includes(reason) && field('orderNumber', 'Número de pedido (opcional)', { max: 40 })}
        {reason === 'producto' && field('productRef', 'Prenda o código (opcional)', { max: 80, placeholder: 'Ej. Pantalón cargo o PAN-010' })}
        {field('name', 'Nombre')}
        {field('email', 'Correo', { type: 'email' })}
        {field('message', 'Mensaje', { area: true })}
        <button className="btn" disabled={status.type === 'loading'}>{status.type === 'loading' ? 'Enviando…' : 'Enviar'}</button>
      </form>
      {status.type === 'error' && <div className="alert alert-error" role="alert">{status.msg}</div>}
    </section>
  );
}
