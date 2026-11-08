import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ListControl } from "@/components/list-control";
import { displayTitle, getAnime } from "@/lib/catalog";
import type { ListEntry } from "@/lib/lists";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const anime = await getAnime(Number(id)).catch(() => null);
  return { title: anime ? displayTitle(anime) : "Anime" };
}

export default async function AnimePage({ params }: Props) {
  const { id } = await params;
  const malId = Number(id);
  if (!Number.isInteger(malId) || malId <= 0) notFound();
  const anime = await getAnime(malId);

  let signedIn = false;
  let entry: ListEntry | null = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
    if (data.user) {
      const res = await supabase
        .from("list_entries")
        .select("mal_id,status,score,progress,title,image,genres")
        .eq("mal_id", malId)
        .maybeSingle();
      entry = (res.data as ListEntry | null) ?? null;
    }
  }

  return (
    <article className="grid gap-6 md:grid-cols-[240px_1fr]">
      <div className="relative mx-auto aspect-[2/3] w-48 overflow-hidden rounded-lg bg-surface-2 md:w-full">
        <Image
          src={anime.images.jpg.large_image_url ?? anime.images.jpg.image_url}
          alt={displayTitle(anime)}
          fill
          sizes="240px"
          className="object-cover"
          priority
        />
      </div>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{displayTitle(anime)}</h1>
          {anime.title_english && anime.title_english !== anime.title && (
            <p className="text-sm text-muted">{anime.title}</p>
          )}
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {anime.score ? <div><dt className="inline text-muted">Nota: </dt><dd className="inline font-semibold">★ {anime.score}</dd></div> : null}
          {anime.type ? <div><dt className="inline text-muted">Tipo: </dt><dd className="inline">{anime.type}</dd></div> : null}
          {anime.episodes ? <div><dt className="inline text-muted">Episodios: </dt><dd className="inline">{anime.episodes}</dd></div> : null}
          {anime.year ? <div><dt className="inline text-muted">Año: </dt><dd className="inline">{anime.year}</dd></div> : null}
          {anime.status ? <div><dt className="inline text-muted">Estado: </dt><dd className="inline">{anime.status}</dd></div> : null}
        </dl>
        <ul className="flex flex-wrap gap-2">
          {anime.genres?.map((g) => (
            <li key={g.mal_id} className="rounded-full bg-surface-2 px-3 py-1 text-xs">
              {g.name}
            </li>
          ))}
        </ul>
        <ListControl
          signedIn={signedIn}
          entry={entry}
          anime={{
            mal_id: anime.mal_id,
            title: displayTitle(anime),
            image: anime.images.jpg.image_url,
            genres: anime.genres?.map((g) => g.name) ?? [],
            episodes: anime.episodes ?? null,
          }}
        />
        {anime.synopsis && <p className="whitespace-pre-line text-sm leading-relaxed">{anime.synopsis}</p>}
      </div>
    </article>
  );
}
