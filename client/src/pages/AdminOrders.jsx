import { request } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { cop } from '../utils/format.js';
import { Spinner } from '../components/Loader.jsx';
import ErrorBox from '../components/ErrorBox.jsx';

const FLOW = ['Pago confirmado', 'En preparación', 'Empacado', 'Entregado a la transportadora', 'En camino', 'Entregado'];
const CANCELABLE = ['Pago confirmado', 'En preparación', 'Empacado']; // solo antes del despacho

/** Opciones del selector: el estado actual y los que vienen después (nunca se retrocede). Cancelar solo antes del despacho. */
const optionsFor = (current) => {
  const i = FLOW.indexOf(current);
  return [current, ...FLOW.slice(i + 1), ...(CANCELABLE.includes(current) ? ['Cancelado'] : [])];
};

/** Pedidos: ver quién compró qué y cambiar el estado (cancelar repone el stock). */
export default function AdminOrders() {
  const { data, loading, error, reload } = useApi(() => request('/orders', { admin: true }));
  const change = (code, status) => {
    if (status === 'Cancelado' && !window.confirm(`¿Cancelar ${code}? Se repondrá el stock y no se podrá volver a cambiar.`)) return;
    request(`/orders/${code}/status`, { method: 'PATCH', admin: true, body: { status } }).then(reload).catch((e) => { alert(e.message); reload(); });
  };
  const remove = (code) => {
    if (!window.confirm(`¿Archivar el pedido ${code}? Sale de esta lista pero no se elimina. Si todavía no se había despachado, se cancela y se repone su stock.`)) return;
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
            <thead><tr><th>Pedido</th><th>Cliente</th><th>Entrega</th><th>Prendas</th><th>Total</th><th>Estado</th><th><span className="sr-only">Archivar</span></th></tr></thead>
            <tbody>
              {data.map((o) => (
                <tr key={o._id}>
                  <td><strong>{o.code}</strong><br /><span className="muted small">{new Date(o.createdAt).toLocaleDateString('es-CO')}</span></td>
                  <td>{o.customerName}<br /><span className="muted small">{o.customerEmail}{o.customerPhone ? ` · ${o.customerPhone}` : ''}</span></td>
                  <td>{o.city}<br /><span className="muted small">{o.address}</span></td>
                  <td>{o.items.map((i, k) => <div key={k} className="small">{i.qty} × {i.name} ({i.size})</div>)}</td>
                  <td>{cop(o.total)}<br /><span className="muted small">{o.paymentMethod}</span></td>
                  <td>
                    <select value={o.status} disabled={o.status === 'Cancelado' || o.status === 'Entregado'} onChange={(e) => change(o.code, e.target.value)} aria-label={`Estado de ${o.code}`}>
                      {optionsFor(o.status).map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><button className="x-btn" onClick={() => remove(o.code)} aria-label={`Archivar ${o.code}`} title="Archivar pedido">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
