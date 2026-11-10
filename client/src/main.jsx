import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import App from './App.jsx';
import './styles.css';

// Pantalla de error: si un componente falla al dibujarse, mostramos el mensaje en vez de dejar la página negra.
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Error de la app:', error, info?.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ padding: '2rem', color: '#f2f2f2', fontFamily: 'sans-serif' }}>
        <h1>Algo salió mal</h1>
        <p>Recarga la página. Si se repite, avisa con este mensaje:</p>
        <pre style={{ whiteSpace: 'pre-wrap', color: '#F5C518' }}>{String(this.state.error?.message || this.state.error)}</pre>
        <button onClick={() => { window.location.hash = '#/'; window.location.reload(); }}>Volver al inicio</button>
      </div>
    );
  }
}

// HashRouter: GitHub Pages no sabe redirigir rutas internas, así que usamos /#/ruta.
// MotionConfig reducedMotion="user": respeta a quienes desactivan animaciones en su sistema.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <MotionConfig reducedMotion="user">
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </MotionConfig>
    </HashRouter>
  </React.StrictMode>
);
