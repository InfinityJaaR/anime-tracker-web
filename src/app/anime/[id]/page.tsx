import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ListControl } from "@/components/list-control";
import { Synopsis } from "@/components/synopsis";
import { displayTitle, getAnime } from "@/lib/catalog";
import { genreEs, TYPE_ES } from "@/lib/genres";
import type { ListEntry } from "@/lib/lists";
import { createClient } from "@/lib/supabase/server";

const STATUS_ES: Record<string, string> = {
  "Finished Airing": "Finalizado",
  "Currently Airing": "En emisión",
  "Not yet aired": "Próximamente",
};

type Props = { params: Promise<{ id: string }> };

const parseId = (id: string) => (/^[1-9]\d{0,8}$/.test(id) ? Number(id) : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const malId = parseId((await params).id);
  const anime = malId ? await getAnime(malId).catch(() => null) : null;
  return { title: anime ? displayTitle(anime) : "Anime no encontrado" };
}

export default async function AnimePage({ params }: Props) {
  const malId = parseId((await params).id);
  if (!malId) notFound();
  const anime = await getAnime(malId);
  if (!anime) notFound();

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
        .eq("user_id", data.user.id) // sin esto, un amigo con el mismo anime rompe maybeSingle()
        .eq("mal_id", malId)
        .maybeSingle();
      entry = (res.data as ListEntry | null) ?? null;
    }
  }

  const facts: [string, string][] = [];
  if (anime.score) facts.push(["Nota en MyAnimeList", `★ ${anime.score}`]);
  if (anime.type) facts.push(["Formato", TYPE_ES[anime.type] ?? anime.type]);
  if (anime.episodes) facts.push(["Episodios", String(anime.episodes)]);
  if (anime.year) facts.push(["Año", String(anime.year)]);
  if (anime.status) facts.push(["Estado", STATUS_ES[anime.status] ?? anime.status]);

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
          <h1 className="text-2xl font-bold sm:text-3xl">{displayTitle(anime)}</h1>
          {anime.title_english && anime.title_english !== anime.title && (
            <p className="text-sm text-muted">{anime.title}</p>
          )}
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt className="inline text-muted">{k}: </dt>
              <dd className="inline font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <ul className="flex flex-wrap gap-2" aria-label="Géneros">
          {anime.genres?.map((g) => (
            <li key={g.mal_id} className="rounded-full bg-surface-2 px-3 py-1 text-xs">
              {genreEs(g.name)}
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
        {anime.synopsis && <Synopsis text={anime.synopsis} />}
      </div>
    </article>
  );
}
