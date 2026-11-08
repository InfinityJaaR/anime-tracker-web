import type { ListEntry } from "@/lib/lists";

export interface GenreStat {
  name: string;
  count: number;
}

export function topGenres(entries: Pick<ListEntry, "genres">[], limit = 8): GenreStat[] {
  const counts = new Map<string, number>();
  for (const e of entries) for (const g of e.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** XP: 100 por anime completado + 2 por cada episodio visto. */
export function computeXp(entries: Pick<ListEntry, "status" | "progress">[]): number {
  return entries.reduce(
    (xp, e) => xp + (e.status === "completed" ? 100 : 0) + e.progress * 2,
    0,
  );
}

const TITLES = ["Novato", "Aprendiz", "Otaku", "Veterano", "Sensei", "Leyenda"];

export interface LevelInfo {
  level: number;
  title: string;
  xp: number;
  currentFloor: number;
  nextAt: number;
  progress: number; // 0..1 hacia el siguiente nivel
}

/** Nivel n empieza en 50·(n-1)² XP. */
export function levelFromXp(xp: number): LevelInfo {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const currentFloor = 50 * (level - 1) ** 2;
  const nextAt = 50 * level ** 2;
  return {
    level,
    title: TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 3))],
    xp,
    currentFloor,
    nextAt,
    progress: (xp - currentFloor) / (nextAt - currentFloor),
  };
}

export function topRated(entries: ListEntry[], limit = 5): ListEntry[] {
  return entries
    .filter((e) => e.score)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit);
}

export function commonAnime(mine: ListEntry[], theirs: ListEntry[]) {
  const t = new Map(theirs.map((e) => [e.mal_id, e]));
  return mine
    .filter((e) => t.has(e.mal_id))
    .map((e) => ({ mine: e, theirs: t.get(e.mal_id)! }));
}
