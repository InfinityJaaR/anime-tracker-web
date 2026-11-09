import Link from "next/link";
import { AnimeGrid } from "@/components/anime-card";
import { getSeasonNow, getTopAnime } from "@/lib/catalog";

const FEATURES = [
  ["Listas", "Organiza lo que ves: viendo, plan de ver, pausado, abandonado y completado."],
  ["Estadísticas", "Tus géneros favoritos de siempre y un nivel que sube con cada anime que terminas."],
  ["Amigos", "Mira qué animes tienen en común y cuáles son sus favoritos."],
  ["Identificar", "Encuentra un anime con una captura de pantalla o describiendo lo que recuerdas."],
] as const;

export default async function Home() {
  const [season, top] = await Promise.all([getSeasonNow(12), getTopAnime(12)]);
  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Lleva el control de todo el anime que ves</h1>
        <p className="mt-2 max-w-2xl text-muted">
          AnimeTracker es gratis. Guarda tus animes por estado, descubre qué ver y compara tus gustos con tus amigos.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/login?mode=signup" className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-fg">
            Crear cuenta gratis
          </Link>
          <Link href="/search" className="rounded-md border border-border px-5 py-3 text-sm font-medium">
            Buscar un anime
          </Link>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(([title, text]) => (
            <li key={title} className="rounded-lg bg-surface-2 p-3">
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold sm:text-2xl">En emisión esta temporada</h2>
        <AnimeGrid items={season.data} />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold sm:text-2xl">Los mejor valorados</h2>
        <AnimeGrid items={top.data} />
      </section>
    </div>
  );
}
