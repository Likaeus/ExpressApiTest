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

## API v1

| Método | Ruta | Acción |
| --- | --- | --- |
| GET | `/api/v1/heroes?page=1&limit=20&search=storm` | Lista paginada |
| POST | `/api/v1/heroes` | Crear un héroe |
| GET | `/api/v1/heroes/:id` | Obtener un héroe |
| PUT | `/api/v1/heroes/:id` | Reemplazar sus datos |
| DELETE | `/api/v1/heroes/:id` | Eliminarlo |
| GET | `/api/v1/heroes/:id/image` | Obtener su imagen |
| PUT | `/api/v1/heroes/:id/image` | Agregar o reemplazar su imagen |

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
