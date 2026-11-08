# AnimeTracker (web)

Versión web de [anime-tracker-app](https://github.com/InfinityJaaR/anime-tracker-app): listas de anime por estado, estadísticas con nivel de experiencia, anime al azar, amigos, búsqueda por imagen y un agente de IA con tu propia API key.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Supabase (Auth + Postgres con RLS)
- [Tenrai API](https://api.tenrai.org/v1) para el catálogo (esquema Jikan v4, IDs de MyAnimeList)
- [trace.moe](https://trace.moe) para buscar por imagen
- Anthropic / OpenAI / Gemini para el agente (clave del usuario)

## Rutas

| Ruta | Descripción |
|---|---|
| `/` | Descubrir: temporada actual y mejor valorados |
| `/search` | Búsqueda con filtro de género (Client Component + Route Handler) |
| `/anime/[id]` | Detalle y control de lista |
| `/lists` | Listas por estado + botón al azar (requiere sesión) |
| `/stats` | Nivel/XP, géneros favoritos, mejores notas |
| `/friends`, `/friends/[username]` | Solicitudes, animes en común, géneros y favoritos del amigo |
| `/identify` | Buscar por imagen y agente de IA |
| `/login` | Registro e inicio de sesión |
| `/api/anime/search`, `/api/trace`, `/api/ai` | Route Handlers |

Cada sección con datos tiene `loading.tsx` y `error.tsx`.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # rellena las claves de Supabase
npm run dev
```

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ejecuta `supabase/migrations/0001_init.sql` en el SQL Editor.
3. Copia la URL y la *anon key* (Project Settings → API) a `.env.local`.
4. Si quieres registro inmediato, desactiva "Confirm email" en Authentication → Providers → Email.

## Privacidad de la API key de IA

La key se escribe en el navegador, se envía a `/api/ai` solo para esa consulta y no se guarda ni se registra en el servidor. Solo se conserva en `localStorage` si marcas "Recordar".

## Nivel de experiencia

100 XP por anime completado + 2 XP por episodio visto. El nivel *n* empieza en 50·(n−1)² XP.

## Despliegue

Importa el repo en Vercel y define `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
