import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ListEntry } from "@/lib/lists";
import { commonAnime, topGenres, topRated } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ username: string }> };

export const metadata: Metadata = { title: "Perfil de amigo" };

export default async function FriendPage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,username")
    .eq("username", decodeURIComponent(username))
    .maybeSingle();
  if (!profile) notFound();

  // RLS solo devuelve las entradas de amigos aceptados (y las propias).
  const { data, error } = await supabase
    .from("list_entries")
    .select("user_id,mal_id,status,score,progress,title,image,genres");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as (ListEntry & { user_id: string })[];
  const mine = rows.filter((r) => r.user_id === auth.user.id);
  const theirs = rows.filter((r) => r.user_id === profile.id);

  const common = commonAnime(mine, theirs);
  const genres = topGenres(theirs, 6);
  const favorites = topRated(theirs, 5);
  const card = "rounded-lg border border-border bg-surface p-4";

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">{profile.username}</h1>
        <Link href="/friends" className="text-sm text-muted underline">Volver</Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section className={card}>
          <h2 className="mb-2 font-semibold">Géneros favoritos</h2>
          <p className="flex flex-wrap gap-2 text-xs">
            {genres.length === 0 && <span className="text-muted">Sin datos (¿son amigos?)</span>}
            {genres.map((g) => (
              <span key={g.name} className="rounded-full bg-surface-2 px-3 py-1">{g.name} · {g.count}</span>
            ))}
          </p>
        </section>
        <section className={card}>
          <h2 className="mb-2 font-semibold">Sus animes favoritos</h2>
          <ol className="space-y-1 text-sm">
            {favorites.map((e) => (
              <li key={e.mal_id} className="flex justify-between gap-2">
                <Link href={`/anime/${e.mal_id}`} className="truncate hover:text-accent">{e.title}</Link>
                <span className="text-muted">★ {e.score}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <section className={card}>
        <h2 className="mb-2 font-semibold">En común ({common.length})</h2>
        {common.length === 0 ? (
          <p className="text-sm text-muted">Todavía no comparten animes.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {common.map(({ mine: m, theirs: t }) => (
              <li key={m.mal_id} className="flex justify-between gap-2">
                <Link href={`/anime/${m.mal_id}`} className="truncate hover:text-accent">{m.title}</Link>
                <span className="shrink-0 text-muted">Tú ★ {m.score ?? "–"} · Él/ella ★ {t.score ?? "–"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
