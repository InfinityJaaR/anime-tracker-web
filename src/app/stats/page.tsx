import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { STATUSES, type ListEntry } from "@/lib/lists";
import { computeXp, levelFromXp, topGenres, topRated } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Estadísticas" };

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data, error } = await supabase
    .from("list_entries")
    .select("mal_id,status,score,progress,title,image,genres")
    .eq("user_id", auth.user.id); // RLS también deja leer a los amigos: filtrar siempre por dueño
  if (error) throw new Error(error.message);
  const entries = (data ?? []) as ListEntry[];

  const lvl = levelFromXp(computeXp(entries));
  const genres = topGenres(entries.filter((e) => e.status !== "plan_to_watch"));
  const maxGenre = genres[0]?.count ?? 1;
  const favorites = topRated(entries);
  const episodes = entries.reduce((n, e) => n + e.progress, 0);
  const card = "rounded-lg border border-border bg-surface p-4";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Estadísticas</h1>

      <section className={card}>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase text-muted">Nivel</p>
            <p className="text-3xl font-bold">
              {lvl.level} <span className="text-lg text-accent">{lvl.title}</span>
            </p>
          </div>
          <p className="text-sm text-muted">
            {lvl.xp} / {lvl.nextAt} XP
          </p>
        </div>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={Math.round(lvl.progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${lvl.progress * 100}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted">100 XP por anime completado + 2 XP por episodio visto.</p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUSES.map((s) => (
          <div key={s.value} className={card}>
            <p className="text-2xl font-bold">{entries.filter((e) => e.status === s.value).length}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className={card}>
          <h2 className="mb-3 font-semibold">Géneros favoritos</h2>
          {genres.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay datos.</p>
          ) : (
            <ul className="space-y-2">
              {genres.map((g) => (
                <li key={g.name} className="text-sm">
                  <div className="flex justify-between">
                    <span>{g.name}</span>
                    <span className="text-muted">{g.count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(g.count / maxGenre) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <h2 className="mb-3 font-semibold">Tus mejor puntuados</h2>
          {favorites.length === 0 ? (
            <p className="text-sm text-muted">Puntúa animes para verlos aquí.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {favorites.map((e) => (
                <li key={e.mal_id} className="flex justify-between gap-2">
                  <Link href={`/anime/${e.mal_id}`} className="truncate hover:text-accent">{e.title}</Link>
                  <span className="shrink-0 text-muted">★ {e.score}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-4 text-xs text-muted">{episodes} episodios vistos en total.</p>
        </section>
      </div>
    </div>
  );
}
