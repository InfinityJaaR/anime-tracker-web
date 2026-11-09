"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimeGrid, GridSkeleton } from "@/components/anime-card";
import type { Anime, NamedResource } from "@/lib/catalog";
import { fetchJson } from "@/lib/fetch-json";

interface Props {
  genres: NamedResource[];
  initialQuery: string;
  initialGenre: string;
  initialPage: number;
}

const field =
  "rounded-md border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent sm:text-sm";

export function SearchClient({ genres, initialQuery, initialGenre, initialPage }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [genre, setGenre] = useState(initialGenre);
  const [page, setPage] = useState(initialPage);
  const [items, setItems] = useState<Anime[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pushHistory = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      // La búsqueda vive en la URL: sobrevive a recargar, a "Atrás" y se puede compartir.
      const url = new URLSearchParams();
      if (query.trim()) url.set("q", query.trim());
      if (genre) url.set("genre", genre);
      if (page > 1) url.set("page", String(page));
      const qs = url.toString();
      const href = qs ? `/search?${qs}` : "/search";
      // Cambiar de página crea una entrada en el historial; escribir solo la reemplaza.
      if (pushHistory.current) router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
      pushHistory.current = false;

      setLoading(true);
      setError(null);
      try {
        const p = new URLSearchParams({ q: query.trim(), page: String(page) });
        if (genre) p.set("genres", genre);
        const json = await fetchJson<{ data: Anime[]; pagination?: { has_next_page: boolean } }>(
          `/api/anime/search?${p}`,
          { signal: controller.signal },
        );
        setItems(json.data);
        setHasNext(Boolean(json.pagination?.has_next_page));
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "No se pudo buscar.");
      }
      if (!controller.signal.aborted) setLoading(false);
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, genre, page, router]);

  const go = (delta: number) => {
    if (loading) return; // evita saltar varias páginas con clics repetidos
    setLoading(true);
    pushHistory.current = true;
    setPage((p) => Math.max(1, p + delta));
  };

  return (
    <div className="space-y-4">
      <form role="search" className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="q" className="sr-only">Título del anime</label>
        <input
          id="q"
          type="search"
          value={query}
          maxLength={100}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Escribe el título de un anime…"
          className={`${field} flex-1`}
        />
        <label htmlFor="genre" className="sr-only">Género</label>
        <select
          id="genre"
          value={genre}
          onChange={(e) => {
            setGenre(e.target.value);
            setPage(1);
          }}
          className={field}
        >
          <option value="">Todos los géneros</option>
          {genres.map((g) => (
            <option key={g.mal_id} value={g.mal_id}>{g.name}</option>
          ))}
        </select>
      </form>
      <p className="text-xs text-muted">Los resultados aparecen mientras escribes.</p>

      <div aria-live="polite">
        {error ? (
          <p role="alert" className="rounded-md border border-border bg-surface p-4 text-sm text-red-500">{error}</p>
        ) : loading ? (
          <GridSkeleton count={12} />
        ) : items.length === 0 ? (
          <div className="rounded-md border border-border bg-surface p-6 text-center text-sm">
            <p className="font-medium">No encontramos animes con esa búsqueda.</p>
            <p className="mt-1 text-muted">
              Prueba con el título en japonés o en inglés (por ejemplo «Shingeki no Kyojin» o «Attack on Titan»), con menos
              palabras, o quita el filtro de género.
            </p>
          </div>
        ) : (
          <AnimeGrid items={items} />
        )}
      </div>

      {!error && (items.length > 0 || page > 1) && (
        <nav aria-label="Páginas de resultados" className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page === 1 || loading}
            onClick={() => go(-1)}
            className="min-h-11 rounded-md border border-border px-4 text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-muted">Página {page}</span>
          <button
            type="button"
            disabled={!hasNext || loading}
            onClick={() => go(1)}
            className="min-h-11 rounded-md border border-border px-4 text-sm disabled:opacity-40"
          >
            Siguiente
          </button>
        </nav>
      )}
    </div>
  );
}
