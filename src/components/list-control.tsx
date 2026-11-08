"use client";

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
    return (
      <p className="rounded-md border border-border bg-surface p-3 text-sm text-muted">
        <a href="/login" className="text-accent underline">Inicia sesión</a> para añadirlo a tus listas.
      </p>
    );
  }

  const field = "rounded-md border border-border bg-surface px-2 py-1.5 text-sm";
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
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-accent-fg disabled:opacity-60"
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
            className="rounded-md border border-border px-3 py-1.5 text-sm"
          >
            Quitar
          </button>
        )}
      </div>
      {message && <p className="text-xs text-muted">{message}</p>}
    </div>
  );
}
