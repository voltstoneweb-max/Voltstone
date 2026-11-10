import { useMemo, useState } from 'react';
import { request, auth } from '../api.js';
import { useApi } from '../hooks/useApi.js';
import { cop, genderText, norm } from '../utils/format.js';
import { Spinner } from '../components/Loader.jsx';
import ErrorBox from '../components/ErrorBox.jsx';
import AdminLogin from './AdminLogin.jsx';

const EMPTY = { sku: '', name: '', category: 'Ropa superior', genders: 'ambos', materials: '', price: '', stock: '', sizes: '', colors: '', description: '', imageUrl: '' };
const CATEGORIES = ['Ropa superior', 'Pantalones', 'Shorts y faldas', 'Vestidos y monos', 'Ropa deportiva', 'Abrigos y exteriores', 'Ropa interior y base layers', 'Accesorios textiles'];
const REASON = { producto: 'Producto', pedido: 'Pedido', devolucion: 'Devolución', garantia: 'Garantía', pagos: 'Pagos', pqrs: 'PQRS', otro: 'Otro' };
const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
const numOrNull = (v) => (v === '' ? null : Number(v));

/** Gestión del catálogo: crear, editar, ocultar y borrar, con generador de descripción por IA. */
function Products() {
  const { data, loading, error, reload } = useApi(() => request('/products/all', { admin: true }));
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const shown = useMemo(() => (data || []).filter((p) => !filter || norm(`${p.name} ${p.category} ${p.sku}`).includes(norm(filter))), [data, filter]);

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

  const payload = () => ({
    ...(form.sku ? { sku: form.sku } : {}),
    name: form.name,
    category: form.category,
    genders: form.genders === 'ambos' ? ['hombre', 'mujer'] : [form.genders],
    materials: list(form.materials),
    price: numOrNull(form.price),
    stock: numOrNull(form.stock),
    sizes: list(form.sizes),
    colors: list(form.colors),
    description: form.description,
    imageUrl: form.imageUrl
  });

  const save = (e) => {
    e.preventDefault();
    run(async () => {
      await request(editId ? `/products/${editId}` : '/products', { method: editId ? 'PUT' : 'POST', admin: true, body: payload() });
      setForm(EMPTY);
      setEditId(null);
    }, editId ? 'Prenda actualizada.' : 'Prenda creada.');
  };

  const edit = (p) => {
    setEditId(p._id);
    setForm({
      sku: p.sku, name: p.name, category: p.category, genders: p.genders.length > 1 ? 'ambos' : p.genders[0],
      materials: p.materials.join(', '), price: p.price == null ? '' : String(p.price), stock: p.stock == null ? '' : String(p.stock),
      sizes: p.sizes.join(', '), colors: p.colors.join(', '), description: p.description, imageUrl: p.imageUrl
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generate = () =>
    run(async () => {
      const { text } = await request('/ai/generate-text', { method: 'POST', admin: true, body: { name: form.name, category: form.category, gender: form.genders === 'ambos' ? 'hombre y mujer' : form.genders, kind: 'descripcion' } });
      setForm((f) => ({ ...f, description: text.slice(0, 600) }));
    }, 'Descripción generada. Revísala antes de guardar.');

  return (
    <>
      <form onSubmit={save} className="admin-form">
        <h2>{editId ? 'Editar prenda' : 'Nueva prenda'}</h2>
        <div className="two">
          <label className="field"><span>Nombre</span><input required value={form.name} onChange={set('name')} /></label>
          <label className="field"><span>Categoría</span><input required list="cats" value={form.category} onChange={set('category')} /><datalist id="cats">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist></label>
          <label className="field"><span>Género</span><select value={form.genders} onChange={set('genders')}><option value="ambos">Hombre y mujer</option><option value="hombre">Solo hombre</option><option value="mujer">Solo mujer</option></select></label>
          <label className="field"><span>Código (vacío = automático)</span><input value={form.sku} onChange={set('sku')} /></label>
          <label className="field"><span>Precio COP entero (vacío = por confirmar)</span><input type="number" min="0" step="1" value={form.price} onChange={set('price')} /></label>
          <label className="field"><span>Stock (vacío = por confirmar)</span><input type="number" min="0" step="1" value={form.stock} onChange={set('stock')} /></label>
          <label className="field"><span>Materiales (separados por coma)</span><input value={form.materials} onChange={set('materials')} /></label>
          <label className="field"><span>Tallas (separadas por coma)</span><input value={form.sizes} onChange={set('sizes')} /></label>
          <label className="field"><span>Colores (separados por coma)</span><input value={form.colors} onChange={set('colors')} /></label>
          <label className="field"><span>Enlace de la foto (opcional)</span><input value={form.imageUrl} onChange={set('imageUrl')} /></label>
        </div>
        <label className="field"><span>Descripción</span><textarea rows="3" maxLength={600} value={form.description} onChange={set('description')} /></label>
        <div className="row">
          <button className="btn" disabled={busy}>{editId ? 'Guardar cambios' : 'Crear prenda'}</button>
          <button type="button" className="btn btn-ghost" disabled={busy || !form.name} onClick={generate}>Generar descripción con IA</button>
          {editId && <button type="button" className="btn btn-ghost" onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancelar</button>}
        </div>
        {msg.text && <div className={`alert alert-${msg.type}`} role="status">{msg.text}</div>}
      </form>

      <label className="search"><span className="sr-only">Filtrar prendas</span><input type="search" placeholder="Filtrar por nombre, categoría o código" value={filter} onChange={(e) => setFilter(e.target.value)} /></label>
      {loading && <Spinner label="Cargando prendas…" />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && (
        <div className="table-wrap">
          <p className="muted small">{shown.length} de {data.length} prendas</p>
          <table>
            <thead><tr><th>Código</th><th>Prenda</th><th>Género</th><th>Precio</th><th>Visible</th><th /></tr></thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p._id}>
                  <td>{p.sku}</td><td>{p.name}<br /><span className="muted small">{p.category}</span></td><td>{genderText(p.genders)}</td><td>{cop(p.price)}</td>
                  <td><input type="checkbox" checked={p.active} aria-label={`Visible: ${p.name}`} onChange={() => run(() => request(`/products/${p._id}`, { method: 'PUT', admin: true, body: { active: !p.active } }), 'Visibilidad actualizada.')} /></td>
                  <td className="actions">
                    <button className="link" onClick={() => edit(p)}>Editar</button>
                    <button className="link danger" onClick={() => window.confirm(`¿Borrar ${p.name}? No se puede deshacer.`) && run(() => request(`/products/${p._id}`, { method: 'DELETE', admin: true }), 'Prenda borrada.')}>Borrar</button>
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

/** Casos del formulario de contacto, con su número de caso y motivo. */
function Messages() {
  const { data, loading, error, reload } = useApi(() => request('/contact', { admin: true }));
  const act = (fn) => fn().then(reload).catch((e) => alert(e.message));
  return (
    <>
      <h2>Casos de contacto</h2>
      {loading && <Spinner label="Cargando casos…" />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.length === 0 && <p className="muted">Todavía no hay casos.</p>}
      {data?.map((m) => (
        <article key={m._id} className={`msg ${m.read ? '' : 'unread'}`}>
          <header><strong>{m.ticket || 'Sin número'} · {REASON[m.reason] || m.subject}</strong><span className="muted">{new Date(m.createdAt).toLocaleString('es-CO')}</span></header>
          <p className="meta">{m.name} · <a href={`mailto:${m.email}`}>{m.email}</a>{m.orderNumber && ` · Pedido ${m.orderNumber}`}{m.productRef && ` · Prenda ${m.productRef}`}</p>
          <p>{m.message}</p>
          <div className="actions">
            {!m.read && <button className="link" onClick={() => act(() => request(`/contact/${m._id}/read`, { method: 'PATCH', admin: true }))}>Marcar como atendido</button>}
            <button className="link danger" onClick={() => act(() => request(`/contact/${m._id}`, { method: 'DELETE', admin: true }))}>Borrar</button>
          </div>
        </article>
      ))}
    </>
  );
}

/** Preguntas de los clientes sobre cada prenda: al responderlas se publican en el detalle del producto. */
function Questions() {
  const { data, loading, error, reload } = useApi(() => request('/questions/all', { admin: true }));
  const [answers, setAnswers] = useState({});
  const act = (fn) => fn().then(reload).catch((e) => alert(e.message));
  return (
    <>
      <h2>Preguntas sobre productos</h2>
      {loading && <Spinner label="Cargando preguntas…" />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.length === 0 && <p className="muted">Todavía no hay preguntas.</p>}
      {data?.map((q) => (
        <article key={q._id} className={`msg ${q.answer ? '' : 'unread'}`}>
          <header><strong>{q.product?.name || 'Prenda eliminada'}</strong><span className="muted">{new Date(q.createdAt).toLocaleString('es-CO')}</span></header>
          <p className="meta">{q.name} · <a href={`mailto:${q.email}`}>{q.email}</a></p>
          <p>{q.question}</p>
          {q.answer ? <p className="qa-a">↳ {q.answer}</p> : (
            <>
              <textarea rows="2" maxLength={600} placeholder="Escribe la respuesta pública" value={answers[q._id] || ''} onChange={(e) => setAnswers({ ...answers, [q._id]: e.target.value })} />
              <div className="actions"><button className="link" onClick={() => act(() => request(`/questions/${q._id}/answer`, { method: 'PATCH', admin: true, body: { answer: answers[q._id] || '' } }))}>Responder y publicar</button></div>
            </>
          )}
          <div className="actions"><button className="link danger" onClick={() => act(() => request(`/questions/${q._id}`, { method: 'DELETE', admin: true }))}>Borrar</button></div>
        </article>
      ))}
    </>
  );
}

export default function Admin() {
  const [logged, setLogged] = useState(!!auth.get());
  const [tab, setTab] = useState('products');
  if (!logged) return <AdminLogin onLogin={() => setLogged(true)} />;
  const tabs = [['products', 'Catálogo'], ['messages', 'Casos'], ['questions', 'Preguntas']];
  return (
    <section className="section">
      <div className="row between">
        <h1>Panel de administración</h1>
        <button className="btn btn-ghost" onClick={() => { auth.clear(); setLogged(false); }}>Cerrar sesión</button>
      </div>
      <div className="row" role="tablist">
        {tabs.map(([v, t]) => <button key={v} role="tab" aria-selected={tab === v} className={`chip ${tab === v ? 'active' : ''}`} onClick={() => setTab(v)}>{t}</button>)}
      </div>
      {tab === 'products' ? <Products /> : tab === 'messages' ? <Messages /> : <Questions />}
    </section>
  );
}
