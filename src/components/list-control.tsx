"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { removeEntry, saveEntry } from "@/app/lists/actions";
import { STATUSES, type ListEntry } from "@/lib/lists";

interface Props {
  signedIn: boolean;
  anime: { mal_id: number; title: string; image: string | null; genres: string[]; episodes: number | null };
  entry: ListEntry | null;
}

export function ListControl({ signedIn, anime, entry }: Props) {
  const [status, setStatus] = useState<string>(entry?.status ?? "plan_to_watch");
  const [score, setScore] = useState<number | "">(entry?.score ?? "");
  const [progress, setProgress] = useState(entry?.progress ?? 0);
  const [saved, setSaved] = useState(Boolean(entry));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!signedIn) {
    const next = encodeURIComponent(`/anime/${anime.mal_id}`);
    return (
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <p className="text-sm font-medium">Guarda este anime en tus listas</p>
        <ul className="flex flex-wrap gap-1.5" aria-label="Listas disponibles">
          {STATUSES.map((s) => (
            <li key={s.value} className="rounded-full bg-surface-2 px-3 py-1 text-xs text-muted">{s.label}</li>
          ))}
        </ul>
        <p className="text-xs text-muted">Es gratis. Necesitas una cuenta para guardar tu progreso y tus notas.</p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/login?mode=signup&next=${next}`} className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg">
            Crear cuenta y guardar
          </Link>
          <Link href={`/login?next=${next}`} className="rounded-md border border-border px-4 py-2.5 text-sm">
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    );
  }

  const field = "rounded-md border border-border bg-surface px-2 py-2 text-base sm:text-sm";
  const save = () =>
    start(async () => {
      const res = await saveEntry({
        mal_id: anime.mal_id,
        status,
        score: score === "" ? null : score,
        progress: status === "completed" && anime.episodes ? anime.episodes : progress,
        title: anime.title,
        image: anime.image,
        genres: anime.genres,
      });
      setMessage(res.error ?? "Guardado");
      if (!res.error) setSaved(true);
    });

  return (
    <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-muted">
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${field} mt-1 block`}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Nota
          <select
            value={score}
            onChange={(e) => setScore(e.target.value ? Number(e.target.value) : "")}
            className={`${field} mt-1 block`}
          >
            <option value="">—</option>
            {Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Episodio
          <input
            type="number"
            min={0}
            max={anime.episodes ?? undefined}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className={`${field} mt-1 block w-20`}
          />
        </label>
        <button
          onClick={save}
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-60"
        >
          {saved ? "Actualizar" : "Añadir"}
        </button>
        {saved && (
          <button
            onClick={() =>
              start(async () => {
                const res = await removeEntry(anime.mal_id);
                setMessage(res.error ?? "Eliminado");
                if (!res.error) setSaved(false);
              })
            }
            disabled={pending}
            className="rounded-md border border-border px-3 py-2.5 text-sm"
          >
            Quitar
          </button>
        )}
      </div>
      {message && <p className="text-xs text-muted">{message}</p>}
    </div>
  );
}
