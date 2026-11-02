import { useState } from 'react';
import { request, auth } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { cop } from '../utils/format.js';
import { Spinner } from '../components/Loader.jsx';
import ErrorBox from '../components/ErrorBox.jsx';
import AdminLogin from './AdminLogin.jsx';

const EMPTY = { sku: '', name: '', category: 'camiseta', gender: 'hombre', price: '', stock: '0', sizes: 'S,M,L,XL', colors: '', description: '' };
const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

/** Gestión de productos: crear, editar, ocultar y borrar, con generador de descripción por IA. */
function Products() {
  const { data, loading, error, reload } = useApi(() => request('/products/all', { admin: true }));
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function run(fn, okText) {
    setBusy(true);
    setMsg({ type: '', text: '' });
    try {
      await fn();
      setMsg({ type: 'ok', text: okText });
      reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const payload = () => ({ ...form, price: Number(form.price), stock: Number(form.stock), sizes: list(form.sizes), colors: list(form.colors) });

  const save = (e) => {
    e.preventDefault();
    run(async () => {
      await request(editId ? `/products/${editId}` : '/products', { method: editId ? 'PUT' : 'POST', admin: true, body: payload() });
      setForm(EMPTY);
      setEditId(null);
    }, editId ? 'Producto actualizado.' : 'Producto creado.');
  };

  const edit = (p) => {
    setEditId(p._id);
    setForm({ ...p, price: String(p.price), stock: String(p.stock), sizes: p.sizes.join(','), colors: p.colors.join(',') });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generate = () =>
    run(async () => {
      const { text } = await request('/ai/generate-text', { method: 'POST', admin: true, body: { name: form.name, category: form.category, gender: form.gender, kind: 'descripcion' } });
      setForm((f) => ({ ...f, description: text.slice(0, 600) }));
    }, 'Descripción generada. Revísala antes de guardar.');

  return (
    <>
      <form onSubmit={save} className="admin-form">
        <h2>{editId ? 'Editar producto' : 'Nuevo producto'}</h2>
        <div className="two">
          <label className="field"><span>SKU</span><input required value={form.sku} onChange={set('sku')} placeholder="CAM-H" /></label>
          <label className="field"><span>Nombre</span><input required value={form.name} onChange={set('name')} /></label>
          <label className="field"><span>Categoría</span><select value={form.category} onChange={set('category')}><option value="camiseta">Camiseta</option><option value="polo">Polo</option><option value="pantalon">Pantalón</option><option value="chaqueta">Chaqueta</option></select></label>
          <label className="field"><span>Género</span><select value={form.gender} onChange={set('gender')}><option value="hombre">Hombre</option><option value="mujer">Mujer</option></select></label>
          <label className="field"><span>Precio (COP, entero)</span><input required type="number" min="0" step="1" value={form.price} onChange={set('price')} /></label>
          <label className="field"><span>Stock</span><input type="number" min="0" step="1" value={form.stock} onChange={set('stock')} /></label>
          <label className="field"><span>Tallas (separadas por coma)</span><input value={form.sizes} onChange={set('sizes')} /></label>
          <label className="field"><span>Colores (separados por coma)</span><input value={form.colors} onChange={set('colors')} /></label>
        </div>
        <label className="field"><span>Descripción</span><textarea rows="3" maxLength={600} value={form.description} onChange={set('description')} /></label>
        <div className="row">
          <button className="btn" disabled={busy}>{editId ? 'Guardar cambios' : 'Crear producto'}</button>
          <button type="button" className="btn btn-ghost" disabled={busy || !form.name} onClick={generate}>Generar descripción con IA</button>
          {editId && <button type="button" className="btn btn-ghost" onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancelar</button>}
        </div>
        {msg.text && <div className={`alert alert-${msg.type}`} role="status">{msg.text}</div>}
      </form>

      {loading && <Spinner label="Cargando productos…" />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>SKU</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Visible</th><th /></tr></thead>
            <tbody>
              {data.map((p) => (
                <tr key={p._id}>
                  <td>{p.sku}</td><td>{p.name}</td><td>{cop(p.price)}</td><td>{p.stock}</td>
                  <td><input type="checkbox" checked={p.active} aria-label={`Visible: ${p.name}`} onChange={() => run(() => request(`/products/${p._id}`, { method: 'PUT', admin: true, body: { active: !p.active } }), 'Visibilidad actualizada.')} /></td>
                  <td className="actions">
                    <button className="link" onClick={() => edit(p)}>Editar</button>
                    <button className="link danger" onClick={() => window.confirm(`¿Borrar ${p.name}? No se puede deshacer.`) && run(() => request(`/products/${p._id}`, { method: 'DELETE', admin: true }), 'Producto borrado.')}>Borrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/** Bandeja de mensajes del formulario de contacto. */
function Messages() {
  const { data, loading, error, reload } = useApi(() => request('/contact', { admin: true }));
  const act = (fn) => fn().then(reload).catch((e) => alert(e.message));
  return (
    <>
      <h2>Mensajes de contacto</h2>
      {loading && <Spinner label="Cargando mensajes…" />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.length === 0 && <p className="muted">Todavía no hay mensajes.</p>}
      {data?.map((m) => (
        <article key={m._id} className={`msg ${m.read ? '' : 'unread'}`}>
          <header><strong>{m.subject}</strong><span className="muted">{new Date(m.createdAt).toLocaleString('es-CO')}</span></header>
          <p className="meta">{m.name} · <a href={`mailto:${m.email}`}>{m.email}</a></p>
          <p>{m.message}</p>
          <div className="actions">
            {!m.read && <button className="link" onClick={() => act(() => request(`/contact/${m._id}/read`, { method: 'PATCH', admin: true }))}>Marcar como leído</button>}
            <button className="link danger" onClick={() => act(() => request(`/contact/${m._id}`, { method: 'DELETE', admin: true }))}>Borrar</button>
          </div>
        </article>
      ))}
    </>
  );
}

export default function Admin() {
  const [logged, setLogged] = useState(!!auth.get());
  const [tab, setTab] = useState('products');
  if (!logged) return <AdminLogin onLogin={() => setLogged(true)} />;
  return (
    <section className="section">
      <div className="row between">
        <h1>Panel de administración</h1>
        <button className="btn btn-ghost" onClick={() => { auth.clear(); setLogged(false); }}>Cerrar sesión</button>
      </div>
      <div className="row" role="tablist">
        <button role="tab" aria-selected={tab === 'products'} className={`chip ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>Productos</button>
        <button role="tab" aria-selected={tab === 'messages'} className={`chip ${tab === 'messages' ? 'active' : ''}`} onClick={() => setTab('messages')}>Mensajes</button>
      </div>
      {tab === 'products' ? <Products /> : <Messages />}
    </section>
  );
}
