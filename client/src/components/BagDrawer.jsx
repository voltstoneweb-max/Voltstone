import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { customer } from '../api.js';
import { cop, imgSrc } from '../utils/format.js';

const SHIPPING = 10000; // envío fijo (el servidor confirma el valor al pagar)

/** Bolsa lateral con las pestañas "Mi bolsa" y "Mis favoritos". */
export default function BagDrawer() {
  const { drawer, closeBag, setTab, items, favs, count, subtotal, setQty, removeItem, toggleFav } = useCart();
  const go = useNavigate();

  useEffect(() => {
    if (!drawer.open) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeBag();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer.open, closeBag]);

  if (!drawer.open) return null;
  const pay = () => { closeBag(); go(customer.get() ? '/pago' : '/cuenta?volver=/pago'); };

  return (
    <div className="drawer-back" onClick={closeBag}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Bolsa de compras" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div role="tablist">
            <button role="tab" aria-selected={drawer.tab === 'bag'} className={drawer.tab === 'bag' ? 'on' : ''} onClick={() => setTab('bag')}>Mi bolsa ({count})</button>
            <button role="tab" aria-selected={drawer.tab === 'fav'} className={drawer.tab === 'fav' ? 'on' : ''} onClick={() => setTab('fav')}>Mis favoritos ({favs.length})</button>
          </div>
          <button className="drawer-x" onClick={closeBag} aria-label="Cerrar">✕</button>
        </div>

        {drawer.tab === 'bag' ? (
          items.length === 0 ? (
            <div className="drawer-empty">
              <h2>Tu bolsa está vacía</h2>
              <p className="muted">Agrega prendas para verlas aquí.</p>
              <Link className="btn" to="/catalogo" onClick={closeBag}>Seguir comprando</Link>
            </div>
          ) : (
            <>
              <ul className="drawer-list">
                {items.map((i) => (
                  <li key={i.key}>
                    <Link to={`/producto/${i.productId}`} onClick={closeBag} className="drawer-img">{i.imageUrl ? <img src={imgSrc(i.imageUrl)} alt="" /> : <span />}</Link>
                    <div>
                      <strong>{i.name}</strong>
                      <p className="muted small">Talla {i.size}</p>
                      <div className="qty qty-sm">
                        <button onClick={() => setQty(i.key, i.qty - 1)} aria-label="Menos" disabled={i.qty <= 1}>−</button>
                        <span aria-live="polite">{i.qty}</span>
                        <button onClick={() => setQty(i.key, i.qty + 1)} aria-label="Más" disabled={i.qty >= Math.min(10, i.stock ?? 10)}>+</button>
                      </div>
                    </div>
                    <div className="drawer-price">
                      <strong>{cop(i.price * i.qty)}</strong>
                      <button className="link" onClick={() => removeItem(i.key)}>Quitar</button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="drawer-foot">
                <p><span>Subtotal</span><strong>{cop(subtotal)}</strong></p>
                <p><span>Envío fijo en Colombia</span><strong>{cop(SHIPPING)}</strong></p>
                <p className="drawer-total"><span>Total</span><strong>{cop(subtotal + SHIPPING)}</strong></p>
                <button className="btn" onClick={pay}>Ir a pagar</button>
                <Link className="link" to="/catalogo" onClick={closeBag}>Seguir comprando</Link>
              </div>
            </>
          )
        ) : favs.length === 0 ? (
          <div className="drawer-empty">
            <h2>Aún no tienes favoritos</h2>
            <p className="muted">Toca el corazón de una prenda para guardarla aquí.</p>
            <Link className="btn" to="/catalogo" onClick={closeBag}>Ver catálogo</Link>
          </div>
        ) : (
          <ul className="drawer-list">
            {favs.map((f) => (
              <li key={f.id}>
                <Link to={`/producto/${f.id}`} onClick={closeBag} className="drawer-img">{f.imageUrl ? <img src={imgSrc(f.imageUrl)} alt="" /> : <span />}</Link>
                <div>
                  <Link to={`/producto/${f.id}`} onClick={closeBag}><strong>{f.name}</strong></Link>
                  <p className="muted small">{f.category}</p>
                </div>
                <div className="drawer-price">
                  <strong>{cop(f.price)}</strong>
                  <button className="link" onClick={() => toggleFav({ _id: f.id })}>Quitar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
