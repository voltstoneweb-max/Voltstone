import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApi } from '../hooks/useApi.js';
import { request } from '../api.js';
import ErrorBox from '../components/ErrorBox.jsx';
import { Spinner } from '../components/Loader.jsx';
import ProductCard from '../components/ProductCard.jsx';

// Atajos del Centro de ayuda a la vista desde el inicio (como en Amazon y Mercado Libre)
const HELP = [
  ['Rastrear mi pedido', '/rastreo'],
  ['Devoluciones y cambios', '/contacto?motivo=devolucion'],
  ['Preguntas frecuentes', '/ayuda'],
  ['Hacer un reclamo', '/contacto?motivo=pqrs']
];

// Cada línea del titular entra una tras otra (única animación de entrada de la página)
const line = (i) => ({ initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 + i * 0.12, duration: 0.5 } });

export default function Home() {
  const { data, loading, error, reload } = useApi(() => request('/products'));
  // Categorías en el orden del catálogo, con la cantidad de prendas de cada una
  const cats = [];
  for (const p of data || []) {
    const found = cats.find((c) => c.name === p.category);
    if (found) found.count += 1; else cats.push({ name: p.category, count: 1 });
  }
  // Prendas destacadas: las que ya tienen foto (sin repetir la misma imagen)
  const featured = [];
  const seen = new Set();
  for (const p of data || []) {
    if (p.imageUrl && !seen.has(p.imageUrl)) { seen.add(p.imageUrl); featured.push(p); }
  }
  return (
    <>
      <section className="hero theme-dark">
        <div className="hero-photo" aria-hidden="true" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}img/fondos/showroom-logo.jpg)` }} />
        <div className="hero-inner">
          <h1>
            <motion.span {...line(0)}>Tecnología</motion.span>
            <motion.span {...line(1)}>que impulsa</motion.span>
            <motion.span className="accent" {...line(2)}>tu estilo</motion.span>
          </h1>
          <motion.p className="hero-sub" {...line(3)}>
            Tienda de ropa en línea en Colombia para hombre y mujer, pensada para el clima cálido y fabricada en Cali.
          </motion.p>
          <motion.div className="row" {...line(4)}>
            <Link className="btn" to="/catalogo">Ver catálogo completo</Link>
            <Link className="btn btn-ghost" to="/ayuda">Centro de ayuda</Link>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Compra por categoría</h2>
          {data && <Link className="link" to="/catalogo">Ver las {data.length} prendas</Link>}
        </div>
        {loading && <Spinner label="Cargando categorías…" />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        <div className="cat-pills">
          {cats.map((c) => (
            <Link key={c.name} className="cat-pill" to={`/catalogo?categoria=${encodeURIComponent(c.name)}`}>
              {c.name} <small>{c.count}</small>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Lo más visto</h2><Link className="link" to="/catalogo">Ver todo</Link></div>
          <div className="grid">{featured.slice(0, 8).map((p) => <ProductCard key={p._id} p={p} />)}</div>
        </section>
      )}

      <section className="section">
        <div className="section-head"><h2>¿Necesitas ayuda?</h2><Link className="link" to="/contacto">Contactar</Link></div>
        <div className="help-grid">
          {HELP.map(([t, to]) => <Link key={t} to={to} className="help-card"><strong>{t}</strong></Link>)}
        </div>
      </section>
        </>
  );
}
