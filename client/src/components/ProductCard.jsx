import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { cop, genderText, imgSrc } from '../utils/format.js';

/**
 * Ficha del producto: primero la foto (si no hay, el espacio queda en blanco), luego nombre, precio, tallas y stock.
 * El código interno (SKU) no se muestra al público.
 */
export default function ProductCard({ p }) {
  const { toggleFav, isFav } = useCart();
  const hasPrice = p.price != null;
  const out = p.stock === 0;
  const low = p.stock > 0 && p.stock <= 5;
  const to = `/producto/${p._id}`;
  return (
    <article className="product">
      <div className="product-top">
        <Link to={to} className="product-photo" aria-label={`Ver ${p.name}`}>
          {p.imageUrl && <img src={imgSrc(p.imageUrl)} alt={p.name} loading="lazy" />}
        </Link>
        {out && <span className="stock out">Agotado</span>}
        <button className={`heart heart-card ${isFav(p._id) ? 'on' : ''}`} onClick={() => toggleFav(p)} aria-pressed={isFav(p._id)} aria-label={isFav(p._id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z" /></svg>
        </button>
      </div>
      <div className="product-body">
        <p className="product-meta">{p.category} · {genderText(p.genders)}</p>
        <h3><Link to={to}>{p.name}</Link></h3>
        <p className={hasPrice ? 'product-price' : 'product-price pending'}>
          {cop(p.price)} {hasPrice && <small>IVA incluido</small>}
        </p>
        <div className="size-row" aria-label="Tallas">
          {p.sizes.length ? p.sizes.map((s) => <span key={s}>{s}</span>) : <span>Tallas por confirmar</span>}
        </div>
        <p className={`stock-note ${out ? 'out' : low ? 'low' : ''}`}>
          {p.stock == null ? 'Stock por confirmar' : out ? 'Agotado por ahora' : low ? `Últimas ${p.stock} unidades` : `${p.stock} unidades disponibles`}
        </p>
        <Link className="btn btn-ghost btn-sm" to={to}>Ver prenda</Link>
      </div>
    </article>
  );
}
