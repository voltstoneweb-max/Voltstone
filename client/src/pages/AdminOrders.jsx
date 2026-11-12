import { request } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { cop } from '../utils/format.js';
import { Spinner } from '../components/Loader.jsx';
import ErrorBox from '../components/ErrorBox.jsx';

const STATUSES = ['Pendiente', 'Pagado', 'En preparación', 'Empacado', 'Enviado', 'Entregado', 'Cancelado'];

/** Pedidos: ver quién compró qué y cambiar el estado (cancelar repone el stock). */
export default function AdminOrders() {
  const { data, loading, error, reload } = useApi(() => request('/orders', { admin: true }));
  const change = (code, status) => {
    if (status === 'Cancelado' && !window.confirm(`¿Cancelar ${code}? Se repondrá el stock y no se podrá volver a cambiar.`)) return;
    request(`/orders/${code}/status`, { method: 'PATCH', admin: true, body: { status } }).then(reload).catch((e) => { alert(e.message); reload(); });
  };
  const remove = (code) => {
    if (!window.confirm(`¿Quitar el pedido ${code}? Si seguía en curso, se repone su stock. No se puede deshacer.`)) return;
    request(`/orders/${code}`, { method: 'DELETE', admin: true }).then(reload).catch((e) => alert(e.message));
  };
  return (
    <>
      <h2>Pedidos</h2>
      {loading && <Spinner label="Cargando pedidos…" />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.length === 0 && <p className="muted">Todavía no hay pedidos.</p>}
      {data && data.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Pedido</th><th>Cliente</th><th>Entrega</th><th>Prendas</th><th>Total</th><th>Estado</th><th><span className="sr-only">Quitar</span></th></tr></thead>
            <tbody>
              {data.map((o) => (
                <tr key={o._id}>
                  <td><strong>{o.code}</strong><br /><span className="muted small">{new Date(o.createdAt).toLocaleDateString('es-CO')}</span></td>
                  <td>{o.customerName}<br /><span className="muted small">{o.customerEmail}{o.customerPhone ? ` · ${o.customerPhone}` : ''}</span></td>
                  <td>{o.city}<br /><span className="muted small">{o.address}</span></td>
                  <td>{o.items.map((i, k) => <div key={k} className="small">{i.qty} × {i.name} ({i.size})</div>)}</td>
                  <td>{cop(o.total)}<br /><span className="muted small">{o.paymentMethod}</span></td>
                  <td>
                    <select value={o.status} disabled={o.status === 'Cancelado'} onChange={(e) => change(o.code, e.target.value)} aria-label={`Estado de ${o.code}`}>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><button className="x-btn" onClick={() => remove(o.code)} aria-label={`Quitar ${o.code}`} title="Quitar pedido">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
