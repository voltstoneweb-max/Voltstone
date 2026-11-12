import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { request } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { useCart } from '../context/CartContext.jsx';
import { cop, genderText, swatch, imgSrc } from '../utils/format.js';
import { Spinner } from '../components/Loader.jsx';
import ErrorBox from '../components/ErrorBox.jsx';
import ProductQA from '../components/ProductQA.jsx';

/** Página de producto: galería, precio, talla, cantidad, bolsa, favoritos, entrega estimada y preguntas. */
export default function ProductPage() {
  const { id } = useParams();
  const { data: p, loading, error, reload } = useApi(() => request(`/products/${id}`), [id]);
  const { addItem, openBag, toggleFav, isFav } = useCart();
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [hint, setHint] = useState(false);

  // Al cambiar de prenda se reinicia la selección
  useEffect(() => { setSize(''); setQty(1); setPhoto(0); setHint(false); }, [id]);

  if (loading) return <section className="section"><Spinner label="Cargando prenda…" /></section>;
  if (error) {
    return (
      <section className="section narrow">
        <ErrorBox message={error} onRetry={reload} />
        <p><Link className="link" to="/catalogo">Volver al catálogo</Link></p>
      </section>
    );
  }

  const photos = p.images?.length ? p.images : p.imageUrl ? [p.imageUrl] : [];
  const out = p.stock === 0;
  const noPrice = p.price == null;
  const canBuy = !out && !noPrice && p.stock != null && p.variants?.length > 0;
  const sizeStock = (s) => p.variants?.find((v) => v.size === s)?.stock ?? 0;
  const maxQty = size ? Math.min(10, sizeStock(size)) : 1;

  function add() {
    if (!size) { setHint(true); return; }
    addItem(p, size, Math.min(qty, maxQty));
    openBag('bag');
  }

  return (
    <section className="section product-page">
      <nav className="crumbs" aria-label="Ruta">
        <Link to="/">Inicio</Link> / <Link to={`/catalogo?categoria=${encodeURIComponent(p.category)}`}>{p.category}</Link> / <strong>{p.name}</strong>
      </nav>

      <div className="pp-grid">
        <div className="pp-gallery">
          {photos.length > 1 && (
            <div className="pp-thumbs" role="tablist" aria-label="Fotos">
              {photos.map((src, i) => (
                <button key={src} role="tab" aria-selected={photo === i} className={photo === i ? 'on' : ''} onClick={() => setPhoto(i)}>
                  <img src={imgSrc(src)} alt={`${p.name}, foto ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
          <div className="pp-main">{photos.length > 0 && <img src={imgSrc(photos[photo])} alt={p.name} />}</div>
        </div>

        <div className="pp-info">
          <p className="product-meta">{p.category} · {genderText(p.genders)}</p>
          <div className="pp-title">
            <h1>{p.name}</h1>
            <button className={`heart ${isFav(p._id) ? 'on' : ''}`} onClick={() => toggleFav(p)} aria-pressed={isFav(p._id)} aria-label={isFav(p._id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}>
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z" /></svg>
            </button>
          </div>
          <p className="pp-price">{cop(p.price)} {!noPrice && <small>IVA incluido</small>}</p>

          {p.colors.length > 0 && (
            <div className="pp-block">
              <p><strong>Color:</strong> {p.colors.join(', ')}</p>
              <div className="colors">{p.colors.map((c) => <span key={c}><i style={{ background: swatch(c) }} />{c}</span>)}</div>
            </div>
          )}

          <div className="pp-block">
            <div className="between row" style={{ margin: 0 }}>
              <p><strong>Talla:</strong> {size || 'elige una'}</p>
              <Link className="link" to="/info/tallas">Guía de tallas</Link>
            </div>
            <div className="size-pick" role="group" aria-label="Talla">
              {p.variants?.length ? p.variants.map((v) => (
                <button key={v.size} className={size === v.size ? 'on' : ''} aria-pressed={size === v.size} onClick={() => { setSize(v.size); setQty(1); setHint(false); }} disabled={v.stock === 0} title={v.stock === 0 ? 'Agotada' : undefined}>{v.size}</button>
              )) : <span className="muted">Tallas por confirmar</span>}
            </div>
            {hint && <p className="field-error" role="alert">Elige una talla para agregar la prenda a tu bolsa.</p>}
          </div>

          <div className="pp-buy">
            <div className="qty" aria-label="Cantidad">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos" disabled={qty <= 1}>−</button>
              <span aria-live="polite">{qty}</span>
              <button onClick={() => setQty(Math.min(maxQty, qty + 1))} aria-label="Más" disabled={qty >= maxQty}>+</button>
            </div>
            <button className={`btn pp-add ${!size && canBuy ? 'pending' : ''}`} onClick={add} disabled={!canBuy}>
              {out ? 'Agotado' : noPrice ? 'Precio por confirmar' : !canBuy ? 'No disponible' : size ? 'Agregar a la bolsa' : 'Selecciona una talla'}
            </button>
          </div>
          {(() => {
            const n = size ? sizeStock(size) : p.stock; // con talla elegida se muestra el stock de ESA talla
            return (
              <p className={`stock-note ${out || n === 0 ? 'out' : n != null && n <= 5 ? 'low' : ''}`}>
                {p.stock == null ? 'Stock por confirmar' : out || n === 0 ? 'Agotado por ahora' : n <= 5 ? `Últimas ${n} unidades${size ? ` en talla ${size}` : ''}` : `${n} unidades disponibles${size ? ` en talla ${size}` : ''}`}
              </p>
            );
          })()}

          <p className="pp-delivery">
            <strong>Entrega estimada:</strong> Cali 1 día hábil · ciudades principales 2 a 4 · resto del país 3 a 8 días hábiles. Envío fijo de $10.000 ·{' '}
            <Link className="link" to="/info/cambios">Cambios y devoluciones</Link>
          </p>

          {p.description && <p className="product-desc">{p.description}</p>}
          <dl className="specs">
            <div><dt>Materiales</dt><dd className="chips">{p.materials.length ? p.materials.map((m) => <span key={m}>{m}</span>) : 'Por confirmar'}</dd></div>
          </dl>
        </div>
      </div>

      <ProductQA productId={p._id} />
    </section>
  );
}
