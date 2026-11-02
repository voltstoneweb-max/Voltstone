import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import App from './App.jsx';
import './styles.css';

// HashRouter: GitHub Pages no sabe redirigir rutas internas, así que usamos /#/ruta.
// MotionConfig reducedMotion="user": respeta a quienes desactivan animaciones en su sistema.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </HashRouter>
  </React.StrictMode>
);
