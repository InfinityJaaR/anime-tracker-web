"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimeGrid } from "@/components/anime-card";
import type { Anime } from "@/lib/catalog";

interface TraceHit {
  mal_id: number | null;
  title: string;
  episode: number | string | null;
  at: number | null;
  similarity: number;
  preview: string | null;
}

const KEY_STORAGE = "anime-tracker:ai";
const box = "space-y-3 rounded-lg border border-border bg-surface p-4";
const input = "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent";
const btn = "rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60";

export function IdentifyClient() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ImageSearch />
      <AiAgent />
    </div>
  );
}

function ImageSearch() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hits, setHits] = useState<TraceHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  async function search() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setHits([]);
    try {
      const body = new FormData();
      body.set("image", file);
      const res = await fetch("/api/trace", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setHits(json.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al buscar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={box}>
      <h2 className="font-semibold">Buscar por imagen</h2>
      <p className="text-xs text-muted">Sube una captura de un episodio (vía trace.moe). No funciona bien con fanart.</p>
      <input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0] ?? null)} className="text-sm" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {preview && <img src={preview} alt="Vista previa" className="max-h-48 rounded-md" />}
      <button onClick={search} disabled={!file || loading} className={btn}>
        {loading ? "Buscando…" : "Identificar"}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <ul className="space-y-2">
        {hits.map((h, i) => (
          <li key={i} className="rounded-md border border-border p-2 text-sm">
            <p className="font-medium">
              {h.mal_id ? <Link href={`/anime/${h.mal_id}`} className="hover:text-accent">{h.title}</Link> : h.title}
            </p>
            <p className="text-xs text-muted">
              {(h.similarity * 100).toFixed(1)}% de coincidencia
              {h.episode ? ` · episodio ${h.episode}` : ""}
              {h.at != null ? ` · min ${Math.floor(h.at / 60)}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AiAgent() {
  const [provider, setProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [remember, setRemember] = useState(false);
  const [description, setDescription] = useState("");
  const [results, setResults] = useState<Anime[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // La key vive solo en el navegador (localStorage) y únicamente si el usuario lo pide.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY_STORAGE) ?? "null");
      if (saved?.apiKey) {
        /* eslint-disable react-hooks/set-state-in-effect */
        setProvider(saved.provider);
        setApiKey(saved.apiKey);
        setModel(saved.model ?? "");
        setRemember(true);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  async function ask() {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      try {
        if (remember) localStorage.setItem(KEY_STORAGE, JSON.stringify({ provider, apiKey, model }));
        else localStorage.removeItem(KEY_STORAGE);
      } catch {
        /* ignorar */
      }
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, apiKey, model, description }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResults(json.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={box}>
      <h2 className="font-semibold">Agente de IA</h2>
      <p className="text-xs text-muted">
        Describe lo que recuerdas. Usa tu propia API key: se envía solo para esta consulta y no se guarda en el servidor.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <select value={provider} onChange={(e) => setProvider(e.target.value)} className={input}>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="openai">OpenAI</option>
          <option value="gemini">Google Gemini</option>
        </select>
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Modelo (opcional)" className={input} />
      </div>
      <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API key" autoComplete="off" className={input} />
      <label className="flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Recordar la key en este navegador
      </label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        placeholder="Ej.: un chico con un cuaderno que mata a gente escribiendo sus nombres…"
        className={input}
      />
      <button onClick={ask} disabled={loading || !apiKey || !description.trim()} className={btn}>
        {loading ? "Pensando…" : "Encontrar anime"}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {results && (results.length ? <AnimeGrid items={results} /> : <p className="text-sm text-muted">Sin coincidencias.</p>)}
    </section>
  );
}
