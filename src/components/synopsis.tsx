"use client";

import { useState } from "react";

export function Synopsis({ text }: { text: string }) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [showing, setShowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (translated) return setShowing((v) => !v);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTranslated(json.text);
      setShowing(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo traducir");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="whitespace-pre-line text-sm leading-relaxed">{showing && translated ? translated : text}</p>
      <button type="button" onClick={toggle} disabled={loading} className="text-xs text-accent underline disabled:opacity-60">
        {loading ? "Traduciendo…" : showing ? "Ver original" : "Traducir al español"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
