/** Mensaje de error claro con acción de reintento. */
export default function ErrorBox({ message, onRetry }) {
  return (
    <div className="alert alert-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-ghost" onClick={onRetry}>
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}
