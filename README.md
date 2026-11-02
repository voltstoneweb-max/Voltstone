# VOLTSTONE · Tienda web full stack

> Guía paso a paso (hoy / próximas horas / próximos días): ver **GUIA_PASOS.md**. Pruebas de la API: `npm test`.

Empresa ficticia con fines académicos (Proyecto final · Jóvenes creaTIvos, ruta avanzada).

| Capa | Tecnología | Dónde vive |
|---|---|---|
| Frontend | React + Vite, framer-motion (animaciones) | **GitHub Pages** |
| Backend | Node + Express (API REST, JWT, IA) | **Render** (gratis) |
| Datos | MongoDB (no relacional) | **MongoDB Atlas** (gratis) |
| Código | Git + GitHub | Repositorio |

GitHub Pages solo sirve archivos estáticos: por eso el backend y la base de datos van en otro sitio y el frontend los llama por HTTPS.

## Estructura

```
voltstone/
├─ client/                 Frontend (React + Vite)
│  └─ src/
│     ├─ api.js            Único punto de comunicación con el backend
│     ├─ hooks/useApi.js   Carga de datos con estados loading/error
│     ├─ components/       Navbar, Footer, ProductCard, ChatBot, Loader, ErrorBox
│     └─ pages/            Home, Catalog, Contact, Admin, AdminLogin
├─ server/                 Backend (Express + Mongoose)
│  └─ src/
│     ├─ index.js          Arranque, CORS, rutas
│     ├─ config/db.js      Conexión a MongoDB
│     ├─ models/           Product, Message, Admin
│     ├─ routes/           auth, products, contact, ai
│     ├─ middleware/       auth (JWT) y errors (errores centralizados)
│     ├─ services/ai.js    Prompt de marca + llamada a Gemini
│     ├─ data/brand.js     Conocimiento de marca para la IA
│     └─ seed/seed.js      Productos iniciales + administrador
└─ .github/workflows/deploy.yml   Despliegue automático a GitHub Pages
```

## 1. Instalar herramientas (Windows 10, PowerShell)

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
# Cierra y abre PowerShell, y verifica:
node -v ; npm -v ; git --version
```

Vite, React, Express, Mongoose, etc. **no se instalan globalmente**: quedan dentro de `node_modules` de cada carpeta con `npm install`.

**Base de datos (MongoDB Atlas):**
1. mongodb.com/atlas → cluster gratis **M0** (NO cargues el "sample dataset"), región N. Virginia.
2. Database Access: crea un usuario con permiso **Read and write to any database** (o solo a `voltstone`) y una clave sin símbolos raros.
3. Network Access: `0.0.0.0/0` (Render no tiene IP fija).
4. Connect → Drivers → copia la cadena `mongodb+srv://...`, cambia `<db_password>` y escribe `/voltstone` antes del `?`. Va en `server/.env` como `MONGODB_URI`.

## 2. Configurar y arrancar en local

```powershell
cd voltstone
npm run install:all
copy server\.env.example server\.env        # edita server\.env (MONGODB_URI, JWT_SECRET, ADMIN_*)
copy client\.env.example client\.env.local
npm run seed                                 # crea 8 productos y el admin
```

Abre **dos** terminales:

```powershell
npm run dev:server    # API en http://localhost:4000  (prueba /api/health)
npm run dev:client    # Web en http://localhost:5173
```

Para detener: `Ctrl + C` en cada terminal.

**IA:** sin `GEMINI_API_KEY`, VoltBot responde con reglas simples (útil para probar). Para IA real, crea una clave gratuita en Google AI Studio y pégala en `server/.env`. Si el modelo `GEMINI_MODEL` ya no existe, cambia el nombre por el vigente.

## 3. Git: 15+ commits y la versión v1

```powershell
git init -b main
git config user.name "Tu nombre"
git config user.email "tu@correo.com"
```

Haz un commit por cada paso (mínimo 15 en total). Ejemplo de historial:

1. `chore: estructura inicial y .gitignore`
2. `feat(server): conexión a MongoDB y modelos`
3. `feat(server): validaciones y manejo de errores`
4. `feat(server): manejo central de errores`
5. `feat(server): login de admin con JWT`
6. `feat(server): CRUD de productos`
7. `feat(server): formulario de contacto con rate limit`
8. `feat(server): seed de productos y admin`
9. `feat(client): base Vite + React, router y estilos`
10. `feat(client): navbar, footer y logo`
11. `feat(client): home con marca y animación`
12. `feat(client): catálogo con filtros y estados de carga`
13. `feat(client): formulario de contacto con validación`
14. `feat(client): login y panel de administración`
15. `feat(ai): VoltBot con conocimiento de marca`
16. `feat(ai): generador de textos en el panel`
17. `ci: despliegue a GitHub Pages`
18. `docs: README y guía de despliegue`

```powershell
git add <archivos del paso>
git commit -m "mensaje"
```

Cuando todo funcione, guarda la **v1** (punto de restauración):

```powershell
git tag -a v1.0.0 -m "Versión 1: entrega base"
git push origin main --tags
# Volver a la v1 si algo se rompe:  git checkout v1.0.0   (y luego: git switch main)
# Para seguir trabajando sin riesgo: git switch -c v2-mejoras
```

## 4. Publicar

1. **GitHub:** crea un repositorio vacío y conéctalo:
   `git remote add origin https://github.com/TU_USUARIO/voltstone.git` → `git push -u origin main`
2. **Backend en Render:** New → Web Service → conecta el repo → Root Directory `server`, Build `npm install`, Start `npm start`. En *Environment* pega las variables de `server/.env` con `CLIENT_ORIGIN=https://TU_USUARIO.github.io` (solo el dominio). Luego ejecuta `npm run seed` una vez en local (usa la misma base de Atlas).
3. **Frontend en GitHub Pages:** en el repo → Settings → Pages → Source: **GitHub Actions**. En Settings → Secrets and variables → Actions → *Variables* crea `VITE_API_URL` = `https://TU-SERVICIO.onrender.com/api`. Haz push a `main` y espera el workflow verde. URL final: `https://TU_USUARIO.github.io/voltstone/`.

Render gratis se duerme tras 15 min sin uso: la primera petición puede tardar ~50 s (la web mostrará su estado de carga o el error claro). Ábrela antes de la defensa.

## 5. Eliminar todo

```powershell
# Proyecto (cierra los servidores primero)
cd ..
rmdir /s /q voltstone
# Solo las dependencias (se reinstalan con npm run install:all)
rmdir /s /q node_modules server\node_modules client\node_modules
# Herramientas
winget uninstall OpenJS.NodeJS.LTS
winget uninstall Git.Git
# Caché de npm
npm cache clean --force   (antes de desinstalar Node)
```

En Atlas: Cluster → ... → Terminate. En Render: Settings → Delete Web Service.

## 6. Lista de chequeo para la defensa

- [ ] URL pública funcionando (GitHub Pages) y responsive en celular
- [ ] Home con marca · Catálogo desde la base de datos · Contacto guarda en la base de datos
- [ ] Admin con login: crea/edita/oculta/borra productos y lee mensajes
- [ ] VoltBot responde con tono de marca, conoce productos y políticas; genera descripciones
- [ ] Mínimo 15 commits, tag v1.0.0, comentarios técnicos claros
- [ ] Precios del seed reemplazados por los del catálogo maestro v3
