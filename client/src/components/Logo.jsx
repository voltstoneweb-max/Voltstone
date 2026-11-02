/** Logotipo: rayo amarillo + VOLT plateado y STONE amarillo (ver identidad en el documento v3). */
export default function Logo({ size = 22 }) {
  return (
    <span className="logo" aria-label="VOLTSTONE">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <path d="M18 2 7 18h7l-2 12 12-17h-7z" fill="#F5C518" />
      </svg>
      <span className="logo-volt">VOLT</span>
      <span className="logo-stone">STONE</span>
    </span>
  );
}
