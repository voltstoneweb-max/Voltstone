import { defineConfig, devices } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:4000/api';
const WEB_URL = process.env.WEB_URL || 'http://localhost:4173';

// Requisitos: la API ya está corriendo (con el seed cargado) y CLIENT_ORIGIN incluye WEB_URL.
// La web se compila y se sirve sola (vite preview) apuntando a esa API.
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1, // las compras comparten stock: en serie para que sean predecibles
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 5'] }, testMatch: /ui-smoke\.spec\.js/ }
  ],
  webServer: process.env.WEB_URL ? undefined : {
    command: 'npm --prefix ../client run build && npm --prefix ../client run preview -- --port 4173 --strictPort',
    url: WEB_URL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: { VITE_API_URL: API_URL }
  }
});
