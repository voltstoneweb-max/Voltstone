import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customer, request } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { useCart } from '../context/CartContext.jsx';
import { cop, imgSrc } from '../utils/format.js';
import ErrorBox from '../components/ErrorBox.jsx';

/** Pago: datos de entrega, medio de pago (simulado) y resumen. El servidor recalcula precios y stock. */
export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const go = useNavigate();
  const user = customer.get();
  const { data: ship } = useApi(() => request('/orders/shipping'));
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '', city: '', address: '', notes: '', paymentMethod: 'Tarjeta', acceptTerms: false });
  const [status, setStatus] = useState({ type: 'idle', msg: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  if (items.length === 0) {
    return (
      <section className="section narrow">
        <div className="section-head"><h1>Pago</h1></div>
        <p>Tu bolsa está vacía.</p>
        <Link className="btn" to="/catalogo">Seguir comprando</Link>
      </section>
    );
  }

  const fee = ship?.fee ?? 10000;
  const total = subtotal + fee;
  const iva = Math.round(subtotal - subtotal / 1.19); // el precio ya incluye IVA: aquí solo se desglosa
  const city = ship?.cities.find((c) => c.name === form.city);

  async function submit(e) {
    e.preventDefault();
    const miss = (msg) => setStatus({ type: 'error', msg });
    if (form.name.trim().length < 2) return miss('Escribe tu nombre.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return miss('Escribe un correo válido.');
    if (!/^\+?\d{7,15}$/.test(form.phone.replace(/[\s()-]/g, ''))) return miss('Escribe un teléfono válido (solo números).');
    if (!form.city) return miss('Elige tu ciudad.');
    if (form.address.trim().length < 6) return miss('Escribe tu dirección completa.');
    if (!form.acceptTerms) return miss('Debes aceptar los términos y condiciones para comprar.');
    setStatus({ type: 'loading', msg: '' });
    try {
      const body = { ...form, items: items.map((i) => ({ productId: i.productId, size: i.size, qty: i.qty })) };
      const { code } = await request('/orders', { method: 'POST', body, asCustomer: true });
      clear();
      go(`/pedido/${code}`);
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    }
  }

  return (
    <section className="section checkout">
      <div className="section-head"><h1>Pago</h1></div>
      <form onSubmit={submit} noValidate className="co-grid">
        <div>
          {!user && <p className="muted small">¿Ya tienes cuenta? <Link className="link" to="/cuenta">Inicia sesión</Link> para ver tus pedidos. También puedes comprar como invitado.</p>}
          <h2>Datos de entrega</h2>
          <div className="two">
            <label className="field"><span>Nombre</span><input maxLength={80} value={form.name} onChange={set('name')} autoComplete="name" /></label>
            <label className="field"><span>Correo</span><input type="email" maxLength={120} value={form.email} onChange={set('email')} autoComplete="email" /></label>
            <label className="field"><span>Teléfono</span><input inputMode="tel" maxLength={20} value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
            <label className="field"><span>Ciudad</span>
              <select value={form.city} onChange={set('city')}>
                <option value="">Elige tu ciudad</option>
                {ship?.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </label>
          </div>
          {city && <p className="muted small">Entrega estimada en {city.min === city.max ? `${city.max} día hábil` : `${city.min} a ${city.max} días hábiles`}.</p>}
          <label className="field"><span>Dirección</span><input maxLength={160} value={form.address} onChange={set('address')} autoComplete="street-address" /></label>
          <label className="field"><span>Indicaciones para el domiciliario (opcional)</span><textarea rows="2" maxLength={300} value={form.notes} onChange={set('notes')} /></label>

          <h2>Medio de pago</h2>
          <div className="pay-options" role="radiogroup" aria-label="Medio de pago">
            {(ship?.paymentMethods || ['Tarjeta', 'PSE', 'Contra entrega']).map((m) => (
              <label key={m} className={`pay-opt ${form.paymentMethod === m ? 'on' : ''}`}>
                <input type="radio" name="pay" value={m} checked={form.paymentMethod === m} onChange={set('paymentMethod')} /> {m}
              </label>
            ))}
          </div>
          <p className="muted small">Pago simulado: no pedimos ni guardamos datos de tarjeta. Con tarjeta o PSE el pedido queda Pagado; contra entrega queda Pendiente.</p>

          <label className="check"><input type="checkbox" checked={form.acceptTerms} onChange={set('acceptTerms')} /> <span>Acepto los <Link className="link" to="/info/terminos" target="_blank">términos y condiciones</Link> y la <Link className="link" to="/info/privacidad" target="_blank">política de privacidad</Link>.</span></label>
        </div>

        <aside className="co-summary">
          <h2>Resumen</h2>
          <ul className="drawer-list">
            {items.map((i) => (
              <li key={i.key}>
                <span className="drawer-img">{i.imageUrl ? <img src={imgSrc(i.imageUrl)} alt="" /> : <span />}</span>
                <div><strong>{i.name}</strong><p className="muted small">Talla {i.size} · {i.qty} {i.qty === 1 ? 'unidad' : 'unidades'}</p></div>
                <div className="drawer-price"><strong>{cop(i.price * i.qty)}</strong></div>
              </li>
            ))}
          </ul>
          <p className="sum"><span>Subtotal</span><strong>{cop(subtotal)}</strong></p>
          <p className="sum muted small"><span>Incluye IVA (19 %)</span><span>{cop(iva)}</span></p>
          <p className="sum"><span>Envío</span><strong>{cop(fee)}</strong></p>
          <p className="sum total"><span>Total</span><strong>{cop(total)}</strong></p>
          <button className="btn" disabled={status.type === 'loading'}>{status.type === 'loading' ? 'Procesando…' : 'Confirmar pedido'}</button>
          {status.type === 'error' && <ErrorBox message={status.msg} />}
        </aside>
      </form>
    </section>
  );
}
