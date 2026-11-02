import { useState } from 'react';
import { request, auth } from '../api.js';

export default function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token } = await request('/auth/login', { method: 'POST', body: form });
      auth.set(token); // sessionStorage: se borra al cerrar la pestaña
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section narrow">
      <h1>Panel de administración</h1>
      <form onSubmit={submit}>
        <label className="field"><span>Correo</span><input type="email" required autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="field"><span>Clave</span><input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button className="btn" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
    </section>
  );
}
