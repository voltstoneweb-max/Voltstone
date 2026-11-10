import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApi } from '../hooks/useApi.js';
import { request } from '../api.js';
import ErrorBox from '../components/ErrorBox.jsx';
import { Spinner } from '../components/Loader.jsx';

// Datos verificables del documento de empresa v3 (sin promesas difíciles de comprobar)
const FACTS = [
  ['Hombre y mujer', 'Ropa urbana para clima cálido'],
  ['Hecha en Cali', 'Diseño y fabricación propios'],
  ['$10.000', 'Envío fijo en Colombia'],
  ['30 días', 'Garantía por defectos de fabricación']
];

// Atajos del Centro de ayuda a la vista desde el inicio (como en Amazon y Mercado Libre)
const HELP = [
  ['Estado de mi pedido', '/contacto?motivo=pedido'],
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
  return (
    <>
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <h1>
          <motion.span {...line(0)}>Tecnología</motion.span>
          <motion.span {...line(1)}>que impulsa</motion.span>
          <motion.span className="accent" {...line(2)}>tu estilo</motion.span>
        </h1>
        <motion.p className="hero-sub" {...line(3)}>
          VOLTSTONE es ropa urbana para hombre y mujer, pensada para el clima cálido y fabricada en Cali.
        </motion.p>
        <motion.div className="row" {...line(4)}>
          <Link className="btn" to="/catalogo">Ver catálogo completo</Link>
          <Link className="btn btn-ghost" to="/ayuda">Centro de ayuda</Link>
        </motion.div>
      </section>

      <section className="facts">
        {FACTS.map(([big, small]) => (
          <div key={big} className="fact"><strong>{big}</strong><span>{small}</span></div>
        ))}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Explora por categoría</h2>
          {data && <Link className="link" to="/catalogo">Ver las {data.length} prendas</Link>}
        </div>
        {loading && <Spinner label="Cargando categorías…" />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        <div className="tiles">
          {cats.map((c) => (
            <Link key={c.name} className="tile" to={`/catalogo?categoria=${encodeURIComponent(c.name)}`}>
              <strong>{c.name}</strong>
              <span>{c.count} prendas</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>¿Necesitas ayuda?</h2><Link className="link" to="/contacto">Contactar</Link></div>
        <div className="help-grid">
          {HELP.map(([t, to]) => <Link key={t} to={to} className="help-card"><strong>{t}</strong></Link>)}
        </div>
      </section>
    </>
  );
}
