"use client";

import { useState } from "react";
import { fetchJson } from "@/lib/fetch-json";

export function Synopsis({ text }: { text: string }) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [showing, setShowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (loading) return;
    if (translated) return setShowing((v) => !v);
    setLoading(true);
    setError(null);
    try {
      const json = await fetchJson<{ text: string }>("/api/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      setTranslated(json.text);
      setShowing(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo traducir.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-2" aria-labelledby="sinopsis">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="sinopsis" className="font-semibold">
          Sinopsis {showing ? "(traducida automáticamente)" : "(en inglés)"}
        </h2>
        <button
          type="button"
          onClick={toggle}
          disabled={loading}
          className="rounded-md border border-accent px-3 py-2 text-sm font-medium text-accent disabled:opacity-60"
        >
          {loading ? "Traduciendo…" : showing ? "Ver texto original" : "Traducir al español"}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="whitespace-pre-line text-sm leading-relaxed">{showing && translated ? translated : text}</p>
    </section>
  );
}
