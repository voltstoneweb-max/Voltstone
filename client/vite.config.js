import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE = ruta del repositorio en GitHub Pages (ej. /voltstone/). En local queda "/".
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/'
});
