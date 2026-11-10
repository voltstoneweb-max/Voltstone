import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { request } from '../api.js';
import { norm } from '../utils/format.js';
import ProductCard from '../components/ProductCard.jsx';
import ProductModal from '../components/ProductModal.jsx';
import { SkeletonGrid } from '../components/Loader.jsx';
import ErrorBox from '../components/ErrorBox.jsx';

const GENDERS = [['', 'Todos'], ['hombre', 'Hombre'], ['mujer', 'Mujer']];

function Chips({ label, options, value, onChange }) {
  return (
    <div className="filter" role="group" aria-label={label}>
      <span className="filter-label">{label}</span>
      {options.map(([v, text]) => (
        <button key={v} className={`chip ${value === v ? 'active' : ''}`} aria-pressed={value === v} onClick={() => onChange(v)}>{text}</button>
      ))}
    </div>
  );
}

/** Catálogo maestro completo. Filtros y búsqueda viven en la URL: se pueden compartir y enlazar desde el Home. */
export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const gender = params.get('genero') || '';
  const category = params.get('categoria') || '';
  const q = params.get('q') || '';
  const [selected, setSelected] = useState(null);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  // El género se filtra en el servidor; categoría y búsqueda en el navegador (se mantiene el catálogo en memoria)
  const { data, loading, error, reload } = useApi(() => request(`/products${gender ? `?gender=${gender}` : ''}`), [gender]);
  const categories = useMemo(() => [...new Set((data || []).map((p) => p.category))], [data]);
  const shown = useMemo(() => {
    const term = norm(q.trim());
    return (data || []).filter((p) => (!category || p.category === category) && (!term || norm([p.name, p.category, p.sku, ...p.materials].join(' ')).includes(term)));
  }, [data, category, q]);
  const groups = categories.map((c) => [c, shown.filter((p) => p.category === c)]).filter(([, list]) => list.length);

  return (
    <section className="section">
      <div className="section-head">
        <h1>Catálogo</h1>
        {data && <p className="muted">Mostrando {shown.length} de {data.length} prendas</p>}
      </div>

      <label className="search">
        <span className="sr-only">Buscar prenda o material</span>
        <input type="search" placeholder="Buscar prenda, material o código (ej. lino, cargo, SUP-001)" value={q} onChange={(e) => setParam('q', e.target.value)} />
      </label>
      <div className="filters">
        <Chips label="Género" options={GENDERS} value={gender} onChange={(v) => setParam('genero', v)} />
        <Chips label="Categoría" options={[['', 'Todas'], ...categories.map((c) => [c, c])]} value={category} onChange={(v) => setParam('categoria', v)} />
      </div>

      {loading && <SkeletonGrid />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && shown.length === 0 && <p className="muted">No encontramos prendas con esa búsqueda. Prueba con otra palabra o escríbenos desde el Centro de ayuda.</p>}
      {groups.map(([c, list]) => (
        <div key={c} className="cat-block">
          <h2 className="cat-title">{c} <small>{list.length}</small></h2>
          <div className="grid">{list.map((p) => <ProductCard key={p._id} p={p} onOpen={setSelected} />)}</div>
        </div>
      ))}
      {selected && <ProductModal p={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
