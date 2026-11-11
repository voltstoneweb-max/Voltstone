import { Link, useParams } from 'react-router-dom';
import { INFO } from '../data/info.js';

/** Páginas informativas y legales: términos, privacidad, cookies, cambios, envíos, tallas y marca. */
export default function Info() {
  const { slug } = useParams();
  const page = INFO[slug];
  if (!page) {
    return (
      <section className="section narrow">
        <div className="section-head"><h1>No encontramos esa página</h1></div>
        <p><Link className="link" to="/ayuda">Ir al Centro de ayuda</Link></p>
      </section>
    );
  }
  return (
    <section className="section legal">
      <div className="section-head"><h1>{page.title}</h1></div>
      {page.updated && <p className="muted small">Última actualización: {page.updated}</p>}
      {page.intro && <p>{page.intro}</p>}
      {page.table && (
        <div className="table-wrap">
          <table>
            <thead><tr>{page.table.head.map((h) => <th key={h}>{h}{h !== 'Talla' ? ' (cm)' : ''}</th>)}</tr></thead>
            <tbody>{page.table.rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
      {page.sections.map(([heading, paragraphs]) => (
        <div key={heading} className="legal-block">
          <h2>{heading}</h2>
          {paragraphs.map((p) => <p key={p}>{p}</p>)}
        </div>
      ))}
      <p className="muted small">¿Dudas? <Link className="link" to="/contacto">Escríbenos</Link> o revisa el <Link className="link" to="/ayuda">Centro de ayuda</Link>.</p>
    </section>
  );
}
