# Pruebas punto a punto (Playwright)

Un navegador real hace clic en la web, que llama a la API, que usa MongoDB. Cubren: carga de todas las páginas
(escritorio y móvil, sin errores de JavaScript), catálogo y búsqueda, bolsa y favoritos, registro, pago,
rastreo, panel de administración (cambio de estado, cancelación y reposición de stock) y VoltBot.

## Correrlas en tu computador
1. Arranca la API con el seed cargado y `CLIENT_ORIGIN` incluyendo `http://localhost:4173`.
2. `npm run install:e2e` (una sola vez) y luego:
   ```bash
   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npm run test:e2e
   ```
   (PowerShell: `$env:E2E_ADMIN_EMAIL="..."; $env:E2E_ADMIN_PASSWORD="..."; npm run test:e2e`)
3. Si una prueba falla: `npm --prefix e2e run report` abre el informe con capturas, video y traza.

Sin credenciales de administrador, las pruebas de panel se saltan (el resto corre igual).
