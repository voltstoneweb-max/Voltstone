import { cop, CATEGORIES } from '../utils/format.js';

export default function ProductCard({ p }) {
  return (
    <article className="card">
      <div className="card-img" aria-hidden="true">
        {p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" /> : <span>{CATEGORIES[p.category]?.slice(0, 3).toUpperCase()}</span>}
      </div>
      <div className="card-body">
        <h3>{p.name}</h3>
        <p className="price">{cop(p.price)}</p>
        <p className="muted">{p.description}</p>
        <p className="meta">Tallas: {p.sizes.join(' · ')}</p>
        <p className="meta">Colores: {p.colors.join(', ') || 'Consultar'}</p>
        <span className={`badge ${p.stock > 0 ? 'ok' : 'out'}`}>{p.stock > 0 ? 'Disponible' : 'Agotado'}</span>
      </div>
    </article>
  );
}
