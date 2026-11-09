/**
 * Cliente del catálogo con Tenrai API (https://api.tenrai.org/v1), que reemplaza
 * a Jikan (descontinuada) y conserva su esquema v4. Sin autenticación; los IDs
 * coinciden con MyAnimeList. Límites: 4 req/s y 120/min por IP.
 */
const CATALOG_API = "https://api.tenrai.org/v1";
const RETRYABLE = new Set([429, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 8000;

export interface NamedResource {
  mal_id: number;
  name: string;
}

export interface Anime {
  mal_id: number;
  title: string;
  title_english?: string | null;
  images: { jpg: { image_url: string; large_image_url?: string } };
  type?: string | null;
  episodes?: number | null;
  status?: string | null;
  score?: number | null;
  year?: number | null;
  synopsis?: string | null;
  genres?: NamedResource[];
  studios?: NamedResource[];
  trailer?: { youtube_id?: string | null };
}

export interface Page<T> {
  data: T[];
  pagination?: { has_next_page: boolean; current_page: number };
}

/** Error del catálogo con el código HTTP de Tenrai (p. ej. 404 = no existe). */
export class CatalogError extends Error {
  constructor(public status: number) {
    super("El catálogo de anime no está disponible ahora. Intenta de nuevo en un momento.");
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function request<T>(path: string, revalidate = 3600): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${CATALOG_API}${path}`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate },
      });
      if (res.ok) return (await res.json()) as T;
      if (!RETRYABLE.has(res.status) || attempt === MAX_ATTEMPTS) {
        throw new CatalogError(res.status);
      }
      const wait = Number(res.headers.get("retry-after")) || attempt;
      await sleep(Math.min(wait, 3) * 1000);
    } catch (e) {
      lastError = e;
      if (e instanceof CatalogError && !RETRYABLE.has(e.status)) break;
      if (attempt === MAX_ATTEMPTS) break;
      await sleep(500 * attempt);
    }
  }
  throw lastError instanceof CatalogError ? lastError : new CatalogError(503);
}

export function searchAnime(query: string, page = 1, genres?: string): Promise<Page<Anime>> {
  const p = new URLSearchParams({ page: String(page), limit: "24", sfw: "true" });
  if (query) p.set("q", query);
  if (genres) p.set("genres", genres);
  if (!query) {
    p.set("order_by", "score");
    p.set("sort", "desc");
  }
  return request(`/anime?${p}`, 600);
}

export const getTopAnime = (limit = 12) =>
  request<Page<Anime>>(`/top/anime?limit=${limit}&sfw=true`, 3600);

export const getSeasonNow = (limit = 12) =>
  request<Page<Anime>>(`/seasons/now?limit=${limit}&sfw=true`, 3600);

/** Devuelve null si el anime no existe. */
export async function getAnime(id: number): Promise<Anime | null> {
  try {
    const anime = (await request<{ data: Anime }>(`/anime/${id}/full`, 3600)).data;
    return { ...anime, synopsis: cleanSynopsis(anime.synopsis) };
  } catch (e) {
    if (e instanceof CatalogError && e.status === 404) return null;
    throw e;
  }
}

/** Quita la firma de MAL ("[Written by MAL Rewrite]", "(Source: …)") al final de la sinopsis. */
function cleanSynopsis(text?: string | null): string | null {
  if (!text) return null;
  return text
    .replace(/\s*\[Written by [^\]]*\]\s*$/i, "")
    .replace(/\s*\(Source: [^)]*\)\s*$/i, "")
    .trim();
}

export async function getGenres(): Promise<NamedResource[]> {
  return (await request<{ data: NamedResource[] }>("/genres/anime", 86400)).data;
}

export const displayTitle = (a: Pick<Anime, "title" | "title_english">) =>
  a.title_english || a.title;
