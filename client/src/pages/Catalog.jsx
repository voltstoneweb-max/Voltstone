import { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { request } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import { SkeletonGrid } from '../components/Loader.jsx';
import ErrorBox from '../components/ErrorBox.jsx';

const GENDERS = [['', 'Todo'], ['hombre', 'Hombre'], ['mujer', 'Mujer']];

export default function Catalog() {
  const [gender, setGender] = useState('');
  // Se vuelve a consultar al API cada vez que cambia el filtro
  const { data, loading, error, reload } = useApi(() => request(`/products${gender ? `?gender=${gender}` : ''}`), [gender]);

  return (
    <section className="section">
      <h1>Catálogo</h1>
      <div className="row" role="group" aria-label="Filtrar por género">
        {GENDERS.map(([v, label]) => (
          <button key={v} className={`chip ${gender === v ? 'active' : ''}`} aria-pressed={gender === v} onClick={() => setGender(v)}>
            {label}
          </button>
        ))}
      </div>
      {loading && <SkeletonGrid />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.length === 0 && <p className="muted">No hay prendas para este filtro todavía.</p>}
      {data && <div className="grid">{data.map((p) => <ProductCard key={p._id} p={p} />)}</div>}
    </section>
  );
}
