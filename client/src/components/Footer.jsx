import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

// Iconos de redes (decorativos: la empresa es ficticia y no tiene perfiles reales)
const Social = ({ label, children }) => (
  <span className="social" role="img" aria-label={label}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
  </span>
);

/** Pie de página por columnas: ayuda, sobre nosotros, información legal y contacto. */
export default function Footer() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  // Suscripción simulada: no envía el correo a ningún servidor
  function subscribe(e) {
    e.preventDefault();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setDone(true);
  }

  return (
    <footer className="footer theme-dark">
      <div className="footer-grid">
        <div>
          <h4>Ayuda</h4>
          <ul>
            <li><Link to="/info/como-comprar">¿Cómo comprar?</Link></li>
            <li><Link to="/info/tallas">Guía de tallas</Link></li>
            <li><Link to="/ayuda">Preguntas frecuentes</Link></li>
            <li><Link to="/rastreo">Rastrear mi pedido</Link></li>
            <li><Link to="/contacto?motivo=devolucion">Gestiona tu cambio</Link></li>
            <li><Link to="/contacto?motivo=pqrs">Peticiones, quejas y reclamos</Link></li>
          </ul>
        </div>

        <div>
          <h4>Sobre nosotros</h4>
          <ul>
            <li><Link to="/info/marca">Nuestra marca</Link></li>
            <li><Link to="/info/sede">Nuestra sede</Link></li>
            <li><Link to="/catalogo">Catálogo completo</Link></li>
            <li><Link to="/contacto">Trabaja con nosotros</Link></li>
          </ul>
        </div>

        <div>
          <h4>Información</h4>
          <ul>
            <li><Link to="/info/terminos">Términos y condiciones</Link></li>
            <li><Link to="/info/privacidad">Privacidad y tratamiento de datos personales</Link></li>
            <li><Link to="/info/cookies">Política de cookies</Link></li>
            <li><Link to="/info/cambios">Cambios, garantías, retracto y reversión</Link></li>
            <li><Link to="/info/envios">Política de envíos</Link></li>
          </ul>
        </div>

        <div>
          <h4>Contacto</h4>
          <ul>
            <li><Link to="/contacto">Escríbenos desde el formulario</Link></li>
            <li><a href="mailto:voltstone.web@gmail.com">voltstone.web@gmail.com</a></li>
            <li>WhatsApp y línea: +57 300 700 8080</li>
            <li>Barrio San Fernando, Cali</li>
          </ul>
        </div>

        <div className="footer-news">
          <h4>Recibe novedades</h4>
          {done ? (
            <p className="footer-note" role="status">Listo, quedaste suscrito.</p>
          ) : (
            <form className="footer-sub" onSubmit={subscribe} noValidate>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Tu correo" aria-label="Recibir novedades" />
              <button className="btn">Unirme</button>
            </form>
          )}
          <h4 style={{ marginTop: '1.4rem' }}>Medios de pago</h4>
          <div className="pay"><span>Tarjeta</span><span>PSE</span></div>
        </div>
      </div>

      <div className="footer-social">
        <Social label="Facebook"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" /></Social>
        <Social label="Instagram"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".6" /></Social>
        <Social label="YouTube"><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="m10 9.5 5 2.5-5 2.5z" /></Social>
        <Social label="TikTok"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.4 2.4 2 4 4.5 4.2" /></Social>
      </div>

      <div className="footer-bottom">
        <div className="footer-logo"><Logo /></div>
        <p>VOLTSTONE CALI SAS · Empresa ficticia con fines académicos. Los datos comerciales y legales son simulados.</p>
        <p><Link to="/admin">Administración</Link></p>
      </div>
    </footer>
  );
}
