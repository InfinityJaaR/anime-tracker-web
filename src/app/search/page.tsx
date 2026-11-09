import type { Metadata } from "next";
import { SearchClient } from "@/components/search-client";
import { getGenres } from "@/lib/catalog";
import { genreEs, isVisibleGenre } from "@/lib/genres";

export const metadata: Metadata = { title: "Buscar anime" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const page = Number(one(sp.page));
  const genres = (await getGenres().catch(() => []))
    .filter((g) => isVisibleGenre(g.name))
    .map((g) => ({ mal_id: g.mal_id, name: genreEs(g.name) }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Buscar anime</h1>
      <SearchClient
        genres={genres}
        initialQuery={one(sp.q).slice(0, 100)}
        initialGenre={/^\d{1,4}$/.test(one(sp.genre)) ? one(sp.genre) : ""}
        initialPage={Number.isInteger(page) && page >= 1 && page <= 500 ? page : 1}
      />
    </div>
  );
}
