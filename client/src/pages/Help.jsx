import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FAQ } from '../data/faq.js';
import { norm } from '../utils/format.js';

// Atajos estilo "Centro de ayuda": cada uno lleva al formulario con el motivo ya elegido
const OPTIONS = [
  ['Estado de mi pedido', 'Consulta dónde va tu compra.', '/contacto?motivo=pedido'],
  ['Devolver o cambiar una prenda', 'Retracto de 5 días hábiles y cambio de talla.', '/contacto?motivo=devolucion'],
  ['Garantía', 'Reclama por defectos de fabricación (30 días).', '/contacto?motivo=garantia'],
  ['Preguntar por un producto', 'Abre una prenda del catálogo y pregúntale al vendedor.', '/catalogo'],
  ['Pagos y facturación', 'Dudas sobre precios, IVA o pagos.', '/contacto?motivo=pagos'],
  ['Petición, queja o reclamo', 'Recibes un número de radicado.', '/contacto?motivo=pqrs']
];

export default function Help() {
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const term = norm(q.trim());
    if (!term) return FAQ;
    return FAQ.map((g) => ({ ...g, items: g.items.filter(([a, b]) => norm(a + ' ' + b).includes(term)) })).filter((g) => g.items.length);
  }, [q]);

  return (
    <section className="section">
      <div className="section-head"><h1>Centro de ayuda</h1></div>
      <p className="muted help-lead">¿En qué podemos ayudarte? Busca una respuesta o elige una opción.</p>
      <label className="search">
        <span className="sr-only">Buscar en la ayuda</span>
        <input type="search" placeholder="Escribe tu duda (ej. devolución, envío, talla)" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      <div className="help-grid">
        {OPTIONS.map(([title, text, to]) => (
          <Link key={title} to={to} className="help-card">
            <strong>{title}</strong>
            <span>{text}</span>
          </Link>
        ))}
        <button className="help-card" onClick={() => window.dispatchEvent(new Event('voltbot:open'))}>
          <strong>Hablar con VoltBot</strong>
          <span>Respuestas inmediatas sobre el catálogo y las políticas.</span>
        </button>
      </div>

      <h2 className="cat-title">Preguntas frecuentes</h2>
      {groups.length === 0 && <p className="muted">No encontramos esa duda. Escríbenos y te respondemos.</p>}
      {groups.map((g) => (
        <div key={g.group} className="cat-block">
          <h3 className="faq-group">{g.group}</h3>
          {g.items.map(([ask, answer]) => (
            <details key={ask} className="faq">
              <summary>{ask}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      ))}

      <div className="contact-box">
        <h3>¿No encontraste lo que buscabas?</h3>
        <p className="muted">Escríbenos y recibirás un número de caso para hacer seguimiento.</p>
        <div className="row"><Link className="btn" to="/contacto">Contactar a VOLTSTONE</Link></div>
        <p className="muted small">Correo: voltstone.web@gmail.com · Teléfono: +57 300 700 8080 (datos ficticios con fines académicos)</p>
      </div>
    </section>
  );
}
