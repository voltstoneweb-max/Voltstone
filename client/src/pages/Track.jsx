import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { request } from '../api.js';
import { cop } from '../utils/format.js';
import { Spinner } from '../components/Loader.jsx';
import ErrorBox from '../components/ErrorBox.jsx';

const STEPS = ['Pendiente', 'Pagado', 'En preparación', 'Empacado', 'Enviado', 'Entregado'];
const fmt = (d) => new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });

/** Rastreo de pedido: el cliente escribe el número que recibió (VOLT-1001) y ve el estado. */
export default function Track() {
  const [params] = useSearchParams();
  const [digits, setDigits] = useState((params.get('codigo') || '').replace(/\D/g, ''));
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState({ type: 'idle', msg: '' });

  async function search(e) {
    e?.preventDefault();
    if (digits.length < 3) return setStatus({ type: 'error', msg: 'Escribe los números de tu pedido (por ejemplo 1001).' });
    setStatus({ type: 'loading', msg: '' });
    setOrder(null);
    try {
      setOrder(await request(`/orders/track/VOLT-${digits}`));
      setStatus({ type: 'idle', msg: '' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    }
  }

  // Si el enlace trae ?codigo=1001, se consulta solo
  useEffect(() => { if (digits) search(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelled = order?.status === 'Cancelado';
  const current = order ? STEPS.indexOf(order.status) : -1;
  const when = (s) => order?.history?.filter((h) => h.status === s).at(-1)?.at;

  return (
    <section className="section narrow track">
      <div className="section-head"><h1>Rastrear pedido</h1></div>
      <p className="muted">Escribe el número de pedido que recibiste en la confirmación de compra para conocer su estado.</p>
      <form onSubmit={search} noValidate>
        <label className="field">
          <span>Número de pedido</span>
          <div className="code-input">
            <b>VOLT-</b>
            <input inputMode="numeric" maxLength={8} value={digits} onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))} placeholder="1001" aria-label="Números del pedido" />
          </div>
        </label>
        <button className="btn" disabled={status.type === 'loading'}>{status.type === 'loading' ? 'Buscando…' : 'Rastrear pedido →'}</button>
      </form>
      {status.type === 'loading' && <Spinner label="Buscando tu pedido…" />}
      {status.type === 'error' && <ErrorBox message={status.msg} />}

      {order && (
        <div className="track-card">
          <div className="between row"><h2>{order.code}</h2><span className={`badge ${cancelled ? 'out' : ''}`}>{order.status}</span></div>
          {!cancelled && order.estimatedDelivery && order.status !== 'Entregado' && <p>Entrega estimada: <strong>{fmt(order.estimatedDelivery)}</strong> en {order.city}.</p>}
          {order.status === 'Entregado' && <p>Entregado en {order.city}.</p>}
          {cancelled && <p>Este pedido fue cancelado.</p>}
          {!cancelled && (
            <ol className="steps">
              {STEPS.map((s, i) => (
                <li key={s} className={i < current ? 'done' : i === current ? 'now' : ''}>
                  <span>{s}</span>
                  {when(s) && <small>{fmt(when(s))}</small>}
                </li>
              ))}
            </ol>
          )}
          <h3>Tu compra</h3>
          <ul className="order-items">
            {order.items.map((it, i) => <li key={i}>{it.qty} × {it.name}{it.size ? ` (talla ${it.size})` : ''} <span>{cop(it.price * it.qty)}</span></li>)}
            <li>Envío <span>{cop(order.shipping)}</span></li>
            <li className="total">Total <span>{cop(order.total)}</span></li>
          </ul>
        </div>
      )}
      <p className="muted small">¿No encuentras tu número de pedido? <Link className="link" to="/contacto?motivo=pedido">Escríbenos</Link>.</p>
    </section>
  );
}
