# AnimeTracker (web)

Lleva el control de todo el anime que ves: listas por estado, estadísticas con nivel de experiencia, un anime al azar de tu "Plan de ver", amigos con quienes comparar gustos, y dos formas de identificar un anime que no recuerdas (con una captura o describiéndolo a una IA con tu propia API key).

Es la versión web de [anime-tracker-app](https://github.com/InfinityJaaR/anime-tracker-app).

**Despliegue:** https://anime-tracker-web-nine.vercel.app

Cómo se construyó con IA: [VIBE_CODING.md](VIBE_CODING.md).

## Funcionalidades

- **Descubrir** (`/`): anime en emisión esta temporada y mejor valorados.
- **Buscar** (`/search`): por título y género; la búsqueda queda en la URL para compartirla o volver atrás.
- **Ficha** (`/anime/[id]`): datos, sinopsis con botón "Traducir al español" y control para guardarlo en tus listas con nota y episodios vistos.
- **Mis listas** (`/lists`): Viendo, Plan de ver, Pausado, Abandonado y Completado. Un anime está en un solo estado a la vez. El botón "🎲 Al azar" escoge uno de tu Plan de ver y abre su ficha.
- **Estadísticas** (`/stats`): nivel y barra de experiencia, géneros favoritos de siempre y tus animes mejor puntuados.
- **Amigos** (`/friends`): envía y acepta solicitudes por nombre de usuario. En el perfil de un amigo ves sus géneros favoritos, sus animes mejor puntuados y los que tienen en común, con pósters y la nota de cada uno.
- **Identificar** (`/identify`): sube una captura (se busca con trace.moe) o describe lo que recuerdas y una IA propone títulos. La IA usa tu propia clave de Anthropic, OpenAI o Gemini.
- **Privacidad y términos** (`/privacidad`): qué datos se guardan y qué servicios externos se usan.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS 4 con tema claro/oscuro automático
- Supabase: autenticación y Postgres con Row Level Security
- [Tenrai API](https://api.tenrai.org/v1) para el catálogo (reemplazo de Jikan, mismo esquema v4, IDs de MyAnimeList)
- [trace.moe](https://trace.moe) para buscar por imagen, MyMemory para traducir sinopsis
- Anthropic / OpenAI / Gemini para el agente de IA (clave del usuario)
- Vercel para el despliegue

## Instalación

Requisitos: Node.js 20 o superior y una cuenta gratuita de [Supabase](https://supabase.com).

1. Clona el repositorio e instala dependencias:

   ```bash
   git clone https://github.com/InfinityJaaR/anime-tracker-web.git
   ```

   ```bash
   cd anime-tracker-web && npm install
   ```

2. Crea un proyecto en Supabase y, en **SQL Editor**, ejecuta el contenido de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). Crea las tablas `profiles`, `list_entries` y `friendships` con sus políticas de seguridad.

3. Copia el archivo de ejemplo de variables:

   ```bash
   cp .env.example .env.local
   ```

   Rellena `.env.local` con los valores de **Project Settings → API** en Supabase:

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública *anon* |

   `.env.local` está en `.gitignore` y nunca se sube al repositorio.

4. En Supabase, **Authentication → URL Configuration**, pon `http://localhost:3000` como *Site URL* (o tu dominio de producción) para que el correo de confirmación lleve a la app. Si prefieres registro sin confirmación, desactiva "Confirm email" en **Authentication → Providers → Email**.

5. Arranca el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abre http://localhost:3000.

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run lint` | ESLint |

## Uso

1. **Crea una cuenta** en "Iniciar sesión" → "Soy nuevo: crear una cuenta gratis". Elige un nombre de usuario: tus amigos te encontrarán por él.
2. **Busca un anime** en "Buscar" o en la portada y abre su ficha.
3. **Guárdalo**: elige el estado (Viendo, Plan de ver…), tu nota y los episodios vistos, y pulsa "Añadir". Cambiar el estado lo mueve de lista.
4. **Mis listas**: cambia de pestaña por estado. Si no sabes qué ver, pulsa "🎲 Al azar".
5. **Estadísticas**: ganas 100 XP por cada anime completado y 2 XP por episodio visto. El nivel *n* empieza en 50·(n−1)² XP.
6. **Amigos**: escribe el nombre de usuario de un amigo y envía la solicitud. Cuando la acepte, abre su perfil para comparar gustos.
7. **Identificar**:
   - *Con una captura*: elige una imagen (máx. 8 MB) y pulsa "Buscar con esta imagen".
   - *Con IA*: elige el proveedor, pega tu clave de API, describe lo que recuerdas y pulsa "Buscar con IA". La clave se envía solo para esa consulta y no se guarda en el servidor; solo queda en tu navegador si marcas "Recordar la clave en este navegador".

## Rutas y estructura

| Ruta | Tipo | Descripción |
|---|---|---|
| `/` | Server Component | Descubrir |
| `/search` | Server + Client | Búsqueda con filtros |
| `/anime/[id]` | Server + Client | Ficha y control de lista |
| `/lists` | Server + Client | Listas por estado y anime al azar (requiere sesión) |
| `/stats` | Server Component | Nivel, géneros y favoritos (requiere sesión) |
| `/friends`, `/friends/[username]` | Server + Server Actions | Solicitudes y comparación (requiere sesión) |
| `/identify` | Client Component | Imagen y agente de IA |
| `/login` | Server Actions | Registro e inicio de sesión |
| `/privacidad` | Server Component | Privacidad y términos |
| `/api/anime/search` | Route Handler | Proxy de búsqueda a Tenrai con caché |
| `/api/trace` | Route Handler | Búsqueda por imagen |
| `/api/ai` | Route Handler | Agente de IA |
| `/api/translate` | Route Handler | Traducción de sinopsis |

Cada sección con datos tiene su `loading.tsx` y `error.tsx`. `src/proxy.ts` renueva la sesión de Supabase y manda al login (con regreso a la página original) a quien entra sin sesión en `/lists`, `/stats` o `/friends`.

```
src/
  app/          rutas, layouts, loading/error y Route Handlers
  components/   componentes de cliente (navbar, formularios, tarjetas…)
  lib/          catálogo Tenrai, Supabase, estadísticas, géneros
supabase/migrations/   esquema SQL con RLS
```

## Despliegue

La app está en Vercel: **https://anime-tracker-web-nine.vercel.app**

El proyecto de Vercel está conectado a este repositorio, así que cada push a `main` despliega solo. Para desplegar tu propia copia:

1. Importa el repositorio en [vercel.com/new](https://vercel.com/new).
2. Añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en **Settings → Environment Variables**.
3. Despliega y pon la URL resultante como *Site URL* y en *Redirect URLs* (`https://tu-dominio/**`) en Supabase.
