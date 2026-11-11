import { Link, useParams } from 'react-router-dom';
import { request } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { cop } from '../utils/format.js';
import { Spinner } from '../components/Loader.jsx';
import ErrorBox from '../components/ErrorBox.jsx';

const fmt = (d) => new Date(d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

/** Recibo en pantalla (sin PDF) con el número de pedido para rastrearlo. */
export default function OrderConfirmation() {
  const { code } = useParams();
  const { data: o, loading, error, reload } = useApi(() => request(`/orders/track/${code}`), [code]);
  if (loading) return <section className="section narrow"><Spinner label="Cargando tu recibo…" /></section>;
  if (error) return <section className="section narrow"><ErrorBox message={error} onRetry={reload} /></section>;

  const subtotal = o.items.reduce((n, i) => n + i.price * i.qty, 0);
  const iva = Math.round(subtotal - subtotal / 1.19);
  return (
    <section className="section narrow">
      <div className="section-head"><h1>¡Gracias por tu compra!</h1></div>
      <div className="case-box">
        <span className="muted">Tu número de pedido</span>
        <strong>{o.code}</strong>
        <span>Estado: <b>{o.status}</b>{o.paymentMethod ? ` · ${o.paymentMethod}` : ''}</span>
        {o.estimatedDelivery && <span>Entrega estimada: <b>{fmt(o.estimatedDelivery)}</b> en {o.city}.</span>}
      </div>
      <h2>Recibo</h2>
      <ul className="order-items">
        {o.items.map((i, k) => <li key={k}>{i.qty} × {i.name} (talla {i.size}) <span>{cop(i.price * i.qty)}</span></li>)}
        <li>Subtotal <span>{cop(subtotal)}</span></li>
        <li className="muted small">Incluye IVA (19 %) <span>{cop(iva)}</span></li>
        <li>Envío <span>{cop(o.shipping)}</span></li>
        <li className="total">Total <span>{cop(o.total)}</span></li>
      </ul>
      <p className="muted small">Guarda este número: con él puedes ver el estado de tu pedido en cualquier momento. El recibo se muestra solo en pantalla.</p>
      <div className="row">
        <Link className="btn" to={`/rastreo?codigo=${o.code.replace('VOLT-', '')}`}>Rastrear mi pedido</Link>
        <Link className="btn btn-ghost" to="/catalogo">Seguir comprando</Link>
      </div>
    </section>
  );
}
