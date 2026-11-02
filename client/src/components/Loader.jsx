/** Estados de carga: spinner genérico y rejilla de "esqueletos" para el catálogo. */
export function Spinner({ label = 'Cargando…' }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid" aria-busy="true" aria-label="Cargando productos">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card skeleton" />
      ))}
    </div>
  );
}
