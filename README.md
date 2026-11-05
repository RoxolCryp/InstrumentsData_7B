# Instrumentario

Aplicación web en español para administrar el inventario de instrumentos. Incluye alta, consulta, búsqueda, edición y eliminación de registros; las fotos se guardan en Vercel Blob y los datos en PostgreSQL administrado por Neon desde Vercel Marketplace.

## Datos de cada registro

- Persona que carga el dato
- Nombre del instrumento
- Número de parte
- Número de serie
- Foto (JPG, PNG o WebP; máximo 5 MB)

## Requisitos

- Node.js 20.19 o superior (para desarrollo local y despliegue)
- Cuenta de Vercel
- Una base PostgreSQL conectada con la integración Neon de Vercel Marketplace
- Un almacenamiento Vercel Blob

> Vercel Postgres como producto independiente fue retirado; para un proyecto nuevo se conecta PostgreSQL mediante Neon en Marketplace. La aplicación usa el driver HTTP serverless de Neon, compatible con funciones de Vercel.

## Ejecución local

1. Instala las dependencias con `npm install`.
2. Copia `.env.example` a `.env.local`.
3. En Neon, copia la cadena de conexión PostgreSQL y asigna `DATABASE_URL`.
4. En Vercel Blob, crea un store y copia el token de lectura/escritura a `BLOB_READ_WRITE_TOKEN`.
5. Inicia el servidor con `npm run dev` y abre `http://localhost:3000`.

La tabla `instruments` se crea automáticamente al realizar la primera consulta a la API. No hace falta ejecutar migraciones manuales. El proyecto requiere Node.js 20.19 o superior; actualiza la versión local si todavía tienes Node 18.

## Despliegue en Vercel

1. Sube este proyecto a un repositorio Git y selecciónalo en Vercel para importarlo como aplicación **Next.js**.
2. En la pestaña **Storage** del proyecto, conecta/crea una base Neon y un almacén Blob.
3. Confirma que Vercel haya agregado `DATABASE_URL` y `BLOB_READ_WRITE_TOKEN` a las variables del proyecto. Si no están, agrégalas desde **Settings → Environment Variables**.
4. Despliega. La primera llamada a `/api/instruments` crea la tabla.

Si la integración cambió el nombre de la URL de conexión, asígnala también a `DATABASE_URL`. Configura las variables para Production y, si corresponde, Preview/Development.

## Rutas API

- `GET /api/instruments`: lista los registros.
- `POST /api/instruments`: crea un registro.
- `PUT /api/instruments/:id`: actualiza un registro.
- `DELETE /api/instruments/:id`: elimina el registro y trata de borrar su foto de Blob.
- `POST /api/upload`: sube una foto a Blob.

## Seguridad antes de uso público

Esta primera versión no incluye inicio de sesión ni control de roles: los endpoints permiten leer, crear, editar y borrar registros a quien pueda acceder al sitio. Antes de publicar datos internos, habilita protección de acceso (por ejemplo, Vercel Authentication/SSO o autenticación propia) y limita las operaciones de API a usuarios autorizados. Vercel Blob usa acceso público para mostrar las fotos.
