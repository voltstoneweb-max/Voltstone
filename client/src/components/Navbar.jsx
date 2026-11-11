import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { customer } from '../api.js';
import { useCart } from '../context/CartContext.jsx';

// Categorías del catálogo maestro (menú "Ropa")
const CATEGORIES = ['Ropa superior', 'Pantalones', 'Shorts y faldas', 'Vestidos y monos', 'Ropa deportiva', 'Abrigos y exteriores', 'Ropa interior y base layers', 'Accesorios textiles'];
const cat = (name) => `/catalogo?categoria=${encodeURIComponent(name)}`;

const Icon = ({ children }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

export default function Navbar() {
  const [menu, setMenu] = useState(false); // menú móvil
  const [ropa, setRopa] = useState(false); // desplegable "Ropa"
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState('');
  const [user, setUser] = useState(customer.get());
  const { count, favs, openBag } = useCart();
  const go = useNavigate();
  const location = useLocation();

  // Cierra los menús al cambiar de página y refresca el estado de la sesión del cliente
  useEffect(() => { setMenu(false); setRopa(false); setSearching(false); }, [location.pathname, location.search]);
  useEffect(() => {
    const sync = () => setUser(customer.get());
    window.addEventListener('voltstone:customer', sync);
    return () => window.removeEventListener('voltstone:customer', sync);
  }, []);

  function search(e) {
    e.preventDefault();
    const term = q.trim();
    go(term ? `/catalogo?q=${encodeURIComponent(term)}` : '/catalogo');
    setQ('');
  }

  return (
    <>
      {/* Los tres avisos van siempre arriba del todo */}
      <div className="promo" role="note">
        <span>Un cambio de talla gratis por pedido</span>
        <span>Envío fijo de $10.000 en Colombia</span>
        <span>30 días de garantía por defectos</span>
      </div>
      <header className="sticky-nav theme-dark">
        <div className="nav">
          <Link to="/" className="nav-brand" aria-label="VOLTSTONE, inicio"><Logo /></Link>

          <nav id="menu" className={`nav-cats ${menu ? 'open' : ''}`} aria-label="Principal">
            <Link to="/catalogo?genero=hombre">Hombre</Link>
            <Link to="/catalogo?genero=mujer">Mujer</Link>
            <div className="has-menu" onMouseEnter={() => setRopa(true)} onMouseLeave={() => setRopa(false)}>
              <button className="menu-btn" aria-expanded={ropa} onClick={() => setRopa(!ropa)}>Ropa <span aria-hidden="true">▾</span></button>
              {ropa && (
                <div className="menu-panel">
                  {CATEGORIES.map((c) => <Link key={c} to={cat(c)}>{c}</Link>)}
                  <Link to="/catalogo" className="menu-all">Ver todo el catálogo</Link>
                </div>
              )}
            </div>
            <Link to="/catalogo?q=b%C3%A1sic">Básicos</Link>
            <Link to={cat('Accesorios textiles')}>Accesorios</Link>
            <Link to="/rastreo">Rastrear pedido</Link>
            <Link to="/ayuda">Ayuda</Link>
          </nav>

          <div className="nav-icons">
            <button className="icon-btn" aria-label="Buscar" aria-expanded={searching} onClick={() => setSearching(!searching)}>
              <Icon><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
            </button>
            <Link className="icon-btn account-btn" to="/cuenta" aria-label={user ? 'Mi cuenta' : 'Iniciar sesión o registrarse'}>
              <Icon><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></Icon>
              <span className="account-text">{user ? user.name.split(' ')[0] : 'Ingresar'}</span>
            </Link>
            <button className="icon-btn" aria-label={`Favoritos (${favs.length})`} onClick={() => openBag('fav')}>
              <Icon><path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z" /></Icon>
              {favs.length > 0 && <span className="badge-n">{favs.length}</span>}
            </button>
            <button className="icon-btn" aria-label={`Bolsa (${count})`} onClick={() => openBag('bag')}>
              <Icon><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8a3 3 0 0 1 6 0" /></Icon>
              {count > 0 && <span className="badge-n">{count}</span>}
            </button>
            <button className="nav-toggle" aria-expanded={menu} aria-controls="menu" onClick={() => setMenu(!menu)}>{menu ? 'Cerrar' : 'Menú'}</button>
          </div>
        </div>

        {searching && (
          <form className="search-bar" onSubmit={search} role="search">
            <input type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar prendas (ej. cargo, polo, lino)" aria-label="Buscar prendas" />
            <button className="btn btn-sm">Buscar</button>
          </form>
        )}
      </header>
    </>
  );
}
