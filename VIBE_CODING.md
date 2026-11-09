# Proceso de Vibe Coding

Registro de cómo se construyó AnimeTracker web con un agente de IA (Claude Code, modelo Claude Opus) en una sola sesión de trabajo, desde la idea hasta el despliegue en Vercel.

El flujo fue siempre el mismo: yo describía qué quería o qué veía mal, la IA proponía un plan o un cambio, lo implementaba, lo verificaba (lint, build y navegador) y hacía un commit. Yo revisaba el resultado en mi navegador y corregía el rumbo.

## 1. Prompts principales

Prompts tal como los escribí (resumidos donde eran largos).

| # | Prompt | Para qué |
|---|---|---|
| 1 | "Quiero una web donde los fans del anime/manga lleven sus listas por estado (viendo, plan de ver, dropped, pausado, completados), vean estadísticas (géneros favoritos de siempre, barra de experiencia con niveles), un botón al azar del plan de ver que abra el detalle, conectar con amigos (animes en común, géneros favoritos de amigos, animes favoritos por nota), descubrir anime, buscar por imagen y un agente de IA donde el usuario pone su propia API key para identificar un anime a partir de una descripción vaga. Referencia: mi app móvil anime-tracker-app." Más los requisitos del curso: Next.js 16 App Router, TypeScript, Tailwind, 4+ rutas, Route Handlers o Supabase, Server y Client Components, `useState`/`useEffect`, responsive, loading/error, Vercel, GitHub con commits iterativos y secretos en `.env.local`. | Definir el producto y los requisitos |
| 2 | "Sí, Supabase" | Elegir backend |
| 3 | "Además debes de tener en cuenta que Jikan ha cerrado servicios completamente, por tanto en mi otro proyecto se migró a otro servicio" | Corregir el plan: usar Tenrai en lugar de Jikan |
| 4 | "Adelante con el plan" | Aprobar el plan |
| 5 | "Todavía no pensemos en subir todo, pero sí hagamos commit de las cosas que estamos avanzando. Además quiero que levantes la página y la abras con Playwright, recorré la página y decime qué se ve roto." | Primera revisión visual automática |
| 6 | "Ya agregué el Supabase en .env.local, de ahí corrige todo lo demás" | Conectar la base de datos real |
| 7 | "No logro iniciar sesión y me devuelve el error de la imagen" (con captura) | Depurar el login |
| 8 | "Ya entré, pero ¿por qué si ya inicié sesión sigue saliendo el botón de entrar (que no es muy UI/UX ese nombre) y tampoco veo en qué usuario o qué cuenta es la que tengo iniciada?" | Mejorar la navegación con sesión |
| 9 | "Encontré un error muy fundamental y es que un anime solo puede estar en un estado únicamente…" | Bug de datos en las listas |
| 10 | "En la sección de amigos también es importante que se vean las imágenes de los animes" | Mejora visual de amigos |
| 11 | Prompt de QA: "Actúa como líder de QA de lanzamiento: crea 5 usuarios simulados (impaciente, escéptico, móvil a 375 px con 3G lento, lector no nativo y literal, el que intenta romper cosas), cada uno desde la portada hasta su primer éxito con capturas; une los hallazgos ordenados por cuántos usuarios los sufren, arregla todo en una pasada y vuelve a pasar los 5 usuarios para demostrar los arreglos." | Auditoría de usabilidad |
| 12 | "Ahora subámoslo a GitHub y Vercel" | Publicar |
| 13 | "Actualiza el README con instrucciones de instalación, uso y enlace al despliegue" + este documento | Documentación |

## 2. Iteraciones con la IA

Cada iteración terminó en uno o más commits (`git log` muestra el historial completo).

1. **Planificación.** La IA leyó mi app móvil para reutilizar su modelo de datos y su cliente de API, y propuso un plan: rutas, esquema de Supabase, cliente del catálogo y un commit por funcionalidad. Lo rechacé una vez para avisar de que Jikan había cerrado. El plan se rehízo con Tenrai.
2. **Base** (`8fd16aa`): layout, tema claro/oscuro y navegación responsive.
3. **Catálogo** (`ba8383d`): cliente de Tenrai con reintentos y límite de peticiones, portada, búsqueda y ficha.
4. **Auth y listas** (`1299c09`): Supabase con RLS, listas por estado y el botón al azar.
5. **Estadísticas** (`0f9ae2d`), **amigos** (`c2ba52a`), **imagen e IA** (`48215f7`) y **README** (`9e0e597`).
6. **Primera revisión con Playwright** (`2f73ca4`): la IA recorrió todas las rutas en escritorio y móvil. Encontró un 404 que devolvía 200, errores de Supabase sin traducir, un aviso de LCP en las imágenes y la traducción de la sinopsis rota.
7. **Login real** (`137a74a`): con mi Supabase configurado aparecieron un error de formulario que se quedaba pegado al cambiar de modo y un aviso de hidratación causado por una extensión de Edge.
8. **Sesión visible** (`76b6fd1`): la barra muestra el usuario, un menú de cuenta y "Cerrar sesión"; "Entrar" pasó a "Iniciar sesión".
9. **Un anime, un estado** (`9344a4c`): corregido el bug de que en mis listas aparecían las filas de mis amigos.
10. **Pósters en amigos** (`6a2d879`).
11. **QA con 5 usuarios simulados** (`2209626`, `1b0b82c`): dos rondas de auditoría con subagentes y una verificación final con 18 comprobaciones automáticas, todas en verde.
12. **Publicación**: repositorio público en GitHub y despliegue en Vercel conectado al repo.

## 3. Decisiones técnicas

| Decisión | Por qué |
|---|---|
| **Supabase** en lugar de Route Handlers con base propia | Auth, Postgres y seguridad por filas (RLS) sin servidor que mantener; el plan gratuito basta. |
| **Tenrai API** como catálogo | Jikan cerró. Tenrai mantiene el esquema de Jikan v4 y los IDs de MyAnimeList, así que el código de mi app móvil se reutilizaba casi sin cambios. |
| Llamar al catálogo **solo desde el servidor** (Server Components y `/api/anime/search`) con caché | Tenrai limita a 4 peticiones/s y 120/min por IP; la caché de Next.js reparte ese límite entre todos los usuarios. |
| Guardar **título, imagen y géneros** dentro de cada entrada de lista | Las estadísticas y la comparación con amigos salen de una sola consulta, sin pedir cada anime a la API. |
| **RLS con una función `are_friends()`** | Los amigos aceptados pueden leer las listas del otro, y nadie más. |
| **La API key de IA nunca se guarda en el servidor** | Se envía en cada consulta a `/api/ai` y se descarta. Solo queda en el navegador si el usuario lo pide. |
| La IA **propone títulos y luego se buscan en Tenrai** | Evita mostrar animes inventados: solo aparecen resultados que existen en el catálogo. |
| **Server Actions** para login, listas y amigos | Formularios que funcionan con `useActionState` y redirección sin crear endpoints a mano. |
| `src/proxy.ts` (el reemplazo de `middleware` en Next 16) | Renueva la sesión, protege `/lists`, `/stats` y `/friends` y devuelve 404 real para IDs de anime no numéricos. |
| Menú móvil con `<details>` | Abre aunque JavaScript no haya cargado todavía (importante con 3G lento). |
| Textos y géneros **en español** y géneros para adultos ocultos | La audiencia es hispanohablante y el catálogo trae etiquetas en inglés. |
| Sin línea de coautor de la IA en los commits | Preferencia personal. |

## 4. Desafíos y cómo se resolvieron con la IA

| Desafío | Solución |
|---|---|
| **Jikan dejó de funcionar** a mitad del diseño. | Le indiqué a la IA que mi app móvil ya había migrado. Revisó ese código y adoptó Tenrai, con los mismos reintentos (429/5xx) y tiempo límite de 8 s. |
| **Next.js 16 cambió APIs** respecto a lo que el modelo conocía (`proxy.ts`, `PageProps` generados, Turbopack). | La IA leyó la documentación incluida en `node_modules/next/dist/docs` antes de escribir código y generó los tipos con `npx next typegen`. |
| **Playwright MCP no podía instalar Chrome** (pedía `sudo` en WSL). | La IA usó Playwright con Chromium desde scripts de Node, y para las pruebas con sesión iniciada usó mi propio navegador Edge con la extensión de Claude. |
| **El login fallaba** con un aviso de hidratación. | El aviso venía de una extensión de Edge que inyecta atributos en `<body>`; se silenció con `suppressHydrationWarning`. Además el formulario se reinicia al cambiar entre iniciar sesión y registrarse. |
| **Un anime aparecía en dos estados.** | La causa era la RLS: como los amigos pueden leer mis filas, las consultas sin filtro traían también las suyas. Se añadió `user_id = yo` en listas, estadísticas, ficha y borrado. |
| **Rutas inexistentes devolvían 200.** | `proxy.ts` reescribe a 404 los IDs no numéricos o cero. Queda un caso conocido: un ID numérico que no existe muestra "Página no encontrada" pero con código 200, por el streaming de la pantalla de carga. |
| **Usabilidad**: la auditoría con 5 usuarios simulados encontró 19 problemas. Los más repetidos: el login no explicaba por qué aparecía ni devolvía a la página original (5 de 5), la portada no explicaba la app (3 de 5) y la sinopsis estaba en inglés (3 de 5). | Se corrigieron todos en una pasada: aviso con motivo y regreso con `?next=` (validado contra redirecciones abiertas), portada explicativa, botón de traducción grande, errores en español, búsqueda en la URL, campos de 16 px para evitar el zoom en iPhone y validación de las APIs. La segunda ronda confirmó los arreglos y encontró detalles menores que también se resolvieron. |
| **Publicar sin filtrar secretos.** | Antes de subir, la IA revisó el historial completo buscando claves, confirmó que `.env.local` estaba ignorado y cargó las variables en Vercel sin mostrarlas. Yo inicié sesión en Vercel y configuré las URL de Supabase. |

## 5. Lo que aprendí del proceso

- Dar contexto real (mi app móvil, el cierre de Jikan) ahorró rehacer trabajo.
- Pedir que la IA **viera** la app (Playwright, capturas) encontró errores que el build no detecta.
- Los bugs más importantes los encontré usando la app yo mismo; la IA los diagnosticó y corrigió rápido una vez descritos.
- Los usuarios simulados sirven para encontrar fricciones de primera vez que como desarrollador ya no veo.
