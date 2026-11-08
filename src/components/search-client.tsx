"use client";

import { useEffect, useState } from "react";
import { AnimeGrid, GridSkeleton } from "@/components/anime-card";
import type { Anime, NamedResource } from "@/lib/catalog";

export function SearchClient({ genres }: { genres: NamedResource[] }) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Anime[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const p = new URLSearchParams({ q: query, page: String(page) });
        if (genre) p.set("genres", genre);
        const res = await fetch(`/api/anime/search?${p}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Error al buscar");
        setItems(json.data);
        setHasNext(Boolean(json.pagination?.has_next_page));
        setLoading(false);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Error al buscar");
        setLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, genre, page]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar anime…"
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <select
          value={genre}
          onChange={(e) => {
            setGenre(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">Todos los géneros</option>
          {genres.map((g) => (
            <option key={g.mal_id} value={g.mal_id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="rounded-md border border-border bg-surface p-4 text-sm text-red-500">{error}</p>
      ) : loading ? (
        <GridSkeleton count={12} />
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-muted">Sin resultados.</p>
      ) : (
        <AnimeGrid items={items} />
      )}

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          disabled={page === 1 || loading}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-sm text-muted">Página {page}</span>
        <button
          type="button"
          disabled={!hasNext || loading}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
