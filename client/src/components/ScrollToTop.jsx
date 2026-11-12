import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const top = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

/**
 * Vuelve arriba al cambiar de página y también al pulsar cualquier enlace interno,
 * incluso si ya estás en esa página (por ejemplo, el logo estando en el inicio).
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(top, [pathname, search]);

  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.('a');
      const href = a?.getAttribute('href');
      if (!a || a.target === '_blank' || !href || !href.startsWith('#/')) return;
      top();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return null;
}
