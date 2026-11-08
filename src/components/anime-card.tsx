import Image from "next/image";
import Link from "next/link";
import { displayTitle, type Anime } from "@/lib/catalog";

export function AnimeCard({ anime, priority = false }: { anime: Anime; priority?: boolean }) {
  return (
    <Link
      href={`/anime/${anime.mal_id}`}
      className="group overflow-hidden rounded-lg border border-border bg-surface transition hover:-translate-y-0.5 hover:border-accent"
    >
      <div className="relative aspect-[2/3] bg-surface-2">
        <Image
          src={anime.images.jpg.large_image_url ?? anime.images.jpg.image_url}
          alt={displayTitle(anime)}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover"
          priority={priority}
        />
        {anime.score ? (
          <span className="absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white">
            ★ {anime.score.toFixed(1)}
          </span>
        ) : null}
      </div>
      <p className="line-clamp-2 p-2 text-sm font-medium group-hover:text-accent">
        {displayTitle(anime)}
      </p>
    </Link>
  );
}

export function AnimeGrid({ items }: { items: Anime[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((a, i) => (
        <AnimeCard key={a.mal_id} anime={a} priority={i < 6} />
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-lg border border-border bg-surface">
          <div className="aspect-[2/3] bg-surface-2" />
          <div className="m-2 h-4 rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}
