"use client";

import { useRouter } from "next/navigation";

export function RandomPick({ ids }: { ids: number[] }) {
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={ids.length === 0}
      title={ids.length === 0 ? "Añade animes a «Plan de ver»" : undefined}
      onClick={() => router.push(`/anime/${ids[Math.floor(Math.random() * ids.length)]}`)}
      className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg disabled:opacity-40"
    >
      🎲 Al azar
    </button>
  );
}
