import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Al cambiar de página, vuelve arriba (los enlaces del pie de página dejaban la vista abajo). */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search]);
  return null;
}
