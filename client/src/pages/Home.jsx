import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApi } from '../hooks/useApi.js';
import { request } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import { SkeletonGrid } from '../components/Loader.jsx';
import ErrorBox from '../components/ErrorBox.jsx';

// Beneficios demostrables (documento v3: el Home evita promesas difíciles de comprobar)
const BENEFITS = [
  ['Catálogo organizado', 'Prendas para hombre y mujer, separadas por tipo.'],
  ['Tallas a la vista', 'Ves qué tallas hay antes de decidir.'],
  ['Información clara', 'Precio con IVA incluido, colores y disponibilidad.'],
  ['VoltBot', 'Un asistente que conoce el catálogo y las políticas.']
];

export default function Home() {
  const { data, loading, error, reload } = useApi(() => request('/products'));
  return (
    <>
      <section className="hero">
        {/* Única animación de entrada de la página: el rayo cae y el titular aparece */}
        <motion.svg className="hero-bolt" viewBox="0 0 32 32" aria-hidden="true" initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 12 }}>
          <path d="M18 2 7 18h7l-2 12 12-17h-7z" fill="#F5C518" />
        </motion.svg>
        <motion.h1 initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.5 }}>
          Tecnología que impulsa tu estilo
        </motion.h1>
        <p className="hero-sub">Ropa urbana para hombre y mujer, pensada para el clima cálido. Colección Urban 2026, hecha en Cali.</p>
        <div className="row">
          <Link className="btn" to="/catalogo">Ver catálogo</Link>
          <Link className="btn btn-ghost" to="/contacto">Escríbenos</Link>
        </div>
      </section>

      <section className="section">
        <h2>Lo que encuentras aquí</h2>
        <ul className="benefits">
          {BENEFITS.map(([t, d]) => (
            <li key={t}><strong>{t}</strong><span>{d}</span></li>
          ))}
        </ul>
      </section>

      <section className="section">
        <h2>Prendas de la colección</h2>
        {loading && <SkeletonGrid count={4} />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        {data && <div className="grid">{data.slice(0, 4).map((p) => <ProductCard key={p._id} p={p} />)}</div>}
      </section>
    </>
  );
}
