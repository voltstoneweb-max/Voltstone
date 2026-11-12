import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// OJO: los efectos de React deben devolver NADA o una función. Esta función va con llaves y sin `return`
// a propósito: antes se pasaba `useEffect(top, ...)` con una flecha que devolvía el resultado de scrollTo, y
// React intentaba ejecutar ese valor al navegar ("n is not a function" en el build de producción).
function goTop() {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  } catch {
    window.scrollTo(0, 0); // navegadores que no entienden behavior: 'instant'
  }
}

/**
 * Vuelve arriba al cambiar de página y también al pulsar cualquier enlace interno,
 * incluso si ya estás en esa página (por ejemplo, el logo estando en el inicio).
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    goTop();
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (e) => {
      const a = e.target instanceof Element ? e.target.closest('a') : null;
      const href = a?.getAttribute('href');
      if (!a || a.target === '_blank' || !href || !href.startsWith('#/')) return;
      goTop();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
