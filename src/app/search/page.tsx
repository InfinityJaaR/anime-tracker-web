import type { Metadata } from "next";
import { SearchClient } from "@/components/search-client";
import { getGenres } from "@/lib/catalog";

export const metadata: Metadata = { title: "Buscar" };

export default async function SearchPage() {
  const genres = await getGenres().catch(() => []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Buscar anime</h1>
      <SearchClient genres={genres} />
    </div>
  );
}
