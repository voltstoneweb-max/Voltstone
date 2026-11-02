import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import Logo from './Logo.jsx';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="nav">
      <Link to="/" className="nav-brand" onClick={close}>
        <Logo />
      </Link>
      <button className="nav-toggle" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(!open)}>
        {open ? 'Cerrar' : 'Menú'}
      </button>
      <nav id="menu" className={`nav-links ${open ? 'open' : ''}`}>
        <NavLink to="/" end onClick={close}>Inicio</NavLink>
        <NavLink to="/catalogo" onClick={close}>Catálogo</NavLink>
        <NavLink to="/contacto" onClick={close}>Contacto</NavLink>
        <NavLink to="/admin" onClick={close}>Admin</NavLink>
      </nav>
    </header>
  );
}
