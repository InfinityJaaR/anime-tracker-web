import { AnimeGrid } from "@/components/anime-card";
import { getSeasonNow, getTopAnime } from "@/lib/catalog";

export default async function Home() {
  const [season, top] = await Promise.all([getSeasonNow(12), getTopAnime(12)]);
  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-3 text-2xl font-bold">En emisión esta temporada</h1>
        <AnimeGrid items={season.data} />
      </section>
      <section>
        <h2 className="mb-3 text-2xl font-bold">Los mejor valorados</h2>
        <AnimeGrid items={top.data} />
      </section>
    </div>
  );
}
