import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { customer, request } from '../api.js';
import ErrorBox from '../components/ErrorBox.jsx';
import { useApi } from '../hooks/useApi.js';
import { cop } from '../utils/format.js';

const EMAIL_RE = /^[^\s@?]+@[^\s@?]+\.[^\s@?]+$/;
// Se abren en otra pestaña para no perder lo que escribiste en el formulario
const Policies = () => (
  <>
    <Link className="link" to="/info/terminos" target="_blank">Términos y condiciones</Link> y la{' '}
    <Link className="link" to="/info/privacidad" target="_blank">Política de privacidad y tratamiento de datos personales</Link>
  </>
);

/** Lista de pedidos de la cuenta, con enlace al rastreo. */
function MyOrders() {
  const { data, loading, error } = useApi(() => request('/orders/mine', { asCustomer: true }));
  return (
    <div className="legal-block">
      <h2>Mis pedidos</h2>
      {loading && <p className="muted">Cargando…</p>}
      {error && <ErrorBox message={error} />}
      {data && data.length === 0 && <p className="muted">Aún no tienes pedidos con esta cuenta.</p>}
      {data && data.length > 0 && (
        <ul className="order-items">
          {data.map((o) => <li key={o.code}><span><Link className="link" to={`/rastreo?codigo=${o.code.replace('VOLT-', '')}`}>{o.code}</Link> · {o.status}</span> <span>{cop(o.total)}</span></li>)}
        </ul>
      )}
    </div>
  );
}

/** Cuenta del cliente: iniciar sesión, crear cuenta (con aceptación de términos y datos) y ver el perfil. */
export default function Account() {
  const [user, setUser] = useState(customer.get());
  const [params] = useSearchParams();
  const go = useNavigate();
  const back = params.get('volver');
  const goBack = back && back.startsWith('/') ? back : null; // solo rutas internas
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', acceptTerms: false, acceptDataPolicy: false });
  const [status, setStatus] = useState({ type: 'idle', msg: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  // Si hay sesión guardada, comprueba que siga válida
  useEffect(() => {
    if (user) request('/customers/me', { asCustomer: true }).catch(() => setUser(null));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Si ya hay sesión y venías de otra página (por ejemplo, el pago), vuelve allá
  useEffect(() => { if (user && goBack) go(goBack, { replace: true }); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e) {
    e.preventDefault();
    if (mode === 'register' && form.name.trim().length < 2) return setStatus({ type: 'error', msg: 'Escribe tu nombre.' });
    if (!EMAIL_RE.test(form.email)) return setStatus({ type: 'error', msg: 'Escribe un correo válido.' });
    if (mode === 'register' && form.password.length < 8) return setStatus({ type: 'error', msg: 'La clave debe tener al menos 8 caracteres.' });
    if (mode === 'login' && !form.password) return setStatus({ type: 'error', msg: 'Escribe tu clave.' });
    if (mode === 'register' && !(form.acceptTerms && form.acceptDataPolicy)) {
      return setStatus({ type: 'error', msg: 'Para crear tu cuenta debes aceptar los términos y el tratamiento de datos personales.' });
    }
    setStatus({ type: 'loading', msg: '' });
    try {
      const body = mode === 'login' ? { email: form.email, password: form.password } : form;
      const data = await request(`/customers/${mode}`, { method: 'POST', body });
      customer.set(data);
      setUser(data);
      setForm({ name: '', email: '', password: '', acceptTerms: false, acceptDataPolicy: false });
      setStatus({ type: 'idle', msg: '' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    }
  }

  if (user) {
    return (
      <section className="section narrow">
        <div className="section-head"><h1>Mi cuenta</h1></div>
        <p>Hola, <strong>{user.name}</strong>.</p>
        <p className="muted">{user.email}</p>
        <div className="row">
          <Link className="btn" to="/rastreo">Rastrear un pedido</Link>
          <button className="btn btn-ghost" onClick={() => { customer.clear(); setUser(null); }}>Cerrar sesión</button>
        </div>
        <MyOrders />
      </section>
    );
  }

  return (
    <section className="section narrow">
      <div className="section-head"><h1>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1></div>
      {goBack && <p className="alert alert-ok" role="status">Para comprar necesitas una cuenta. Inicia sesión o crea una; tu bolsa se conserva.</p>}
      <div className="filter" role="tablist" aria-label="Cuenta">
        <button role="tab" aria-selected={mode === 'login'} className={`chip ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setStatus({ type: 'idle', msg: '' }); }}>Ingresar</button>
        <button role="tab" aria-selected={mode === 'register'} className={`chip ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setStatus({ type: 'idle', msg: '' }); }}>Crear cuenta</button>
      </div>
      <form onSubmit={submit} noValidate className="account-form">
        {mode === 'register' && <label className="field"><span>Nombre</span><input maxLength={60} value={form.name} onChange={set('name')} autoComplete="name" /></label>}
        <label className="field"><span>Correo</span><input type="email" maxLength={120} value={form.email} onChange={set('email')} autoComplete="email" /></label>
        <label className="field"><span>Clave{mode === 'register' ? ' (mínimo 8 caracteres)' : ''}</span><input type="password" maxLength={100} value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>

        {mode === 'register' ? (
          <>
            <label className="check"><input type="checkbox" checked={form.acceptTerms} onChange={set('acceptTerms')} /> <span>Acepto los <Link className="link" to="/info/terminos" target="_blank">términos y condiciones</Link>.</span></label>
            <label className="check"><input type="checkbox" checked={form.acceptDataPolicy} onChange={set('acceptDataPolicy')} /> <span>Autorizo el tratamiento de mis datos personales según la <Link className="link" to="/info/privacidad" target="_blank">política de privacidad</Link>.</span></label>
          </>
        ) : (
          <p className="muted small">Al iniciar sesión aceptas los <Policies />.</p>
        )}

        <button className="btn" disabled={status.type === 'loading'}>{status.type === 'loading' ? 'Enviando…' : mode === 'login' ? 'Ingresar' : 'Crear mi cuenta'}</button>
        {status.type === 'error' && <ErrorBox message={status.msg} />}
      </form>
    </section>
  );
}
