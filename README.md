# Heroes API

API REST construida con Express y MongoDB para administrar tarjetas de héroes e imágenes.

## Requisitos

- Node.js 18 o posterior
- MongoDB local o una URI de MongoDB Atlas

## Configuración

1. Ejecuta `npm install`.
2. Copia `.env.example` como `.env` y ajusta `DATABASE_URL`.
3. Usa `npm run dev` durante el desarrollo o `npm start` en ejecución normal.

La API escucha por defecto en `http://localhost:8000`. Su estado puede comprobarse con `GET /health`.

Los héroes se almacenan en `Characters.HeroesCard`. Las cuentas se almacenan separadamente en `Users.User_Info` dentro del mismo clúster.

`JWT_SECRET` es obligatorio y debe ser un valor aleatorio de al menos 32 caracteres. No reutilices contraseñas ni publiques el archivo `.env`.

## Autenticación

| Método | Ruta | Acción |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Crear una cuenta e iniciar sesión |
| POST | `/api/v1/auth/login` | Iniciar sesión |
| GET | `/api/v1/auth/me` | Obtener la cuenta autenticada |

Registro:

```json
{
  "name": "Usuario",
  "email": "usuario@example.com",
  "password": "UnaClaveSegura123"
}
```

El login recibe `email` y `password` y devuelve un `accessToken`. Para crear, modificar o eliminar héroes, envíalo en cada petición:

```http
Authorization: Bearer ACCESS_TOKEN
```

Los tokens expiran por defecto en 15 minutos. Las contraseñas se procesan con bcrypt y nunca se guardan ni se devuelven en texto plano.

## API v1

| Método | Ruta | Acción |
| --- | --- | --- |
| GET | `/api/v1/heroes?page=1&limit=20&search=storm` | Lista paginada |
| POST | `/api/v1/heroes` | Crear un héroe (autenticado) |
| GET | `/api/v1/heroes/:id` | Obtener un héroe |
| PUT | `/api/v1/heroes/:id` | Reemplazar sus datos (autenticado) |
| DELETE | `/api/v1/heroes/:id` | Eliminarlo (autenticado) |
| GET | `/api/v1/heroes/:id/image` | Obtener su imagen |
| PUT | `/api/v1/heroes/:id/image` | Agregar o reemplazar su imagen (autenticado) |

Ejemplo JSON para crear o actualizar:

```json
{
  "name": "Storm",
  "description": "Mutante y miembro de los X-Men",
  "details": {
    "powers": "Control del clima",
    "weakness": "Claustrofobia"
  }
}
```

También puede crearse el héroe con una imagen en una sola petición `multipart/form-data`. Envía `name`, `description`, `powers` y `weakness` como campos de texto, y el archivo como `image`. Se aceptan JPEG, PNG, WebP y GIF, hasta 5 MB.

Las rutas antiguas bajo `/api` siguen disponibles temporalmente para facilitar la migración, pero están deprecadas.

## Pruebas

Ejecuta `npm test`. Las pruebas básicas usan el runner integrado de Node.js, sin dependencias adicionales.
