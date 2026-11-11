const base = import.meta.env.BASE_URL;

/** Logotipo con las imágenes de marca: isotipo + nombre en el menú, logo completo con lema en el pie de página. */
export default function Logo({ variant = 'nav' }) {
  if (variant === 'full') {
    return <img className="logo-full" src={`${base}img/logo/logo-completo.png`} alt="VOLTSTONE, viste el rendimiento" />;
  }
  return (
    <span className="logo" aria-label="VOLTSTONE">
      <img className="logo-mark" src={`${base}img/logo/isotipo.png`} alt="" />
      <span className="logo-word">VOLTSTONE</span>
    </span>
  );
}
