import { cop, genderText, swatch } from '../utils/format.js';

/**
 * Ficha del producto. Funciona sin foto: muestra todos los datos que existan
 * (materiales, tallas, colores, precio, stock) y marca "por confirmar" lo que falte.
 */
export default function ProductCard({ p, onOpen }) {
  const hasPrice = p.price != null;
  return (
    <article className="product">
      {p.imageUrl && (
        <div className="product-top">
          <img src={p.imageUrl} alt={p.name} loading="lazy" />
        </div>
      )}
      <div className="product-body">
        <p className="product-meta">
          {p.category} · {genderText(p.genders)} · <span className="sku-line">{p.sku}</span>
        </p>
        <h3>{p.name}</h3>
        <p className={hasPrice ? 'product-price' : 'product-price pending'}>
          {cop(p.price)} {hasPrice && <small>IVA incluido</small>}
        </p>
        {p.description && <p className="product-desc">{p.description}</p>}
        <dl className="specs">
          <div>
            <dt>Materiales</dt>
            <dd className="chips">{p.materials.length ? p.materials.map((m) => <span key={m}>{m}</span>) : 'Por confirmar'}</dd>
          </div>
          <div>
            <dt>Tallas</dt>
            <dd className="chips">{p.sizes.length ? p.sizes.map((s) => <span key={s}>{s}</span>) : 'Por confirmar'}</dd>
          </div>
          {p.colors.length > 0 && (
            <div>
              <dt>Colores</dt>
              <dd className="colors">{p.colors.map((c) => <span key={c}><i style={{ background: swatch(c) }} />{c}</span>)}</dd>
            </div>
          )}
          <div>
            <dt>Stock</dt>
            <dd>{p.stock == null ? 'Por confirmar' : p.stock > 0 ? `${p.stock} unidades` : 'Agotado'}</dd>
          </div>
        </dl>
        <button className="btn btn-ghost btn-sm" onClick={() => onOpen(p)}>Ver detalle y preguntar</button>
      </div>
    </article>
  );
}
