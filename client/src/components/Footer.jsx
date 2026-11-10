import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <p>VOLTSTONE CALI SAS · Cali, Colombia</p>
      <p className="muted">Empresa ficticia con fines académicos. Los datos comerciales y legales son simulados.</p>
      <p>
        <Link className="link" to="/ayuda">Centro de ayuda</Link> · <Link className="link" to="/contacto">Contacto</Link> · <Link className="link" to="/admin">Administración</Link>
      </p>
    </footer>
  );
}
