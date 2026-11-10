# VOLTSTONE

> Empresa ficticia con fines académicos (proyecto final). Tienda de ropa urbana con catálogo, contacto, panel de administración y asistente con IA.

## Enlaces

- **Página publicada:** https://voltstoneweb-max.github.io/Voltstone/
- **Repositorio:** https://github.com/voltstoneweb-max/Voltstone
- **API en Render:** https://voltstone-api-9rnl.onrender.com/api/health (plan gratuito: la primera visita puede tardar cerca de un minuto en despertar)

## Qué incluye

- **Inicio** con la marca y accesos al catálogo.
- **Catálogo** de prendas leído desde la base de datos, con filtro por género.
- **Contacto**: formulario que guarda los mensajes en la base.
- **Panel de administración** con login: crea, edita, oculta y borra prendas, y lee los mensajes.
- **VoltBot**: asistente con IA (Gemini) que responde preguntas frecuentes con la información de la marca, las políticas y el catálogo real. Si la IA falla, responde con reglas simples.

## Tecnologías

| Parte | Tecnología | Dónde vive |
|---|---|---|
| Frontend | React 18, Vite, React Router (HashRouter), Framer Motion | GitHub Pages |
| Backend | Node.js, Express, Mongoose, JWT, bcryptjs, helmet, express-rate-limit | Render |
| Base de datos | MongoDB Atlas | Atlas |
| IA | API de Gemini, llamada solo desde el servidor | Google |

GitHub Pages solo sirve archivos estáticos, por eso el servidor corre aparte en Render.

## Estructura

```
client/   página en React (se publica en GitHub Pages)
server/   API en Express (se publica en Render)
.github/workflows/deploy.yml   publica el cliente en cada push a main
```

## Cómo correrlo en tu computador

Requisitos: Node.js 20 o superior, Git y una base como MongoDB (Atlas o local).

```bash
npm run install:all
cp server/.env.example server/.env        # en Windows: copy server\.env.example server\.env
cp client/.env.example client/.env.local  # en Windows: copy client\.env.example client\.env.local
npm run seed                              # crea los productos y el administrador
npm run dev:server                        # terminal 1
npm run dev:client                        # terminal 2
```

La página queda en `http://localhost:5173/` y la API en `http://localhost:4000/api`.

## Variables de entorno

Los valores reales nunca se suben al repositorio (`.env` está en `.gitignore`). Solo se incluyen los nombres en los archivos `.env.example`.

| Archivo | Variables |
|---|---|
| `server/.env` | `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `AI_DAILY_LIMIT` |
| `client/.env.local` | `VITE_API_URL` |

## Pruebas

Con el servidor encendido:

```bash
cd server
node --test tests/api.test.mjs
```

Verifican el catálogo, el filtro por género, la protección de rutas de administración, el rechazo de tokens falsos, el login incorrecto, la validación del contacto y del chat, el CORS y los encabezados de seguridad.

## Seguridad

- Contraseñas con bcrypt y sesión del administrador con JWT de 8 horas.
- CORS cerrado: solo responde a los dominios permitidos.
- Límites de peticiones en login, contacto y chat, más un tope diario de consultas a la IA.
- Cabeceras de seguridad con helmet y validación de los datos de entrada.
- La clave de Gemini vive solo en el servidor; el navegador nunca la ve.
- Mensajes de error genéricos hacia el cliente.

## Versiones

| Versión | Qué contiene |
|---|---|
| `v1.0.0` | Primera publicación: catálogo, contacto, administración y VoltBot |
| `v1.0.1` | VoltBot con respaldo si la IA falla, regla contra instrucciones maliciosas y `.gitignore` reforzado |
