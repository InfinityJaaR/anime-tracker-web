"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimeGrid } from "@/components/anime-card";
import type { Anime } from "@/lib/catalog";
import { fetchJson } from "@/lib/fetch-json";

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
const input = "w-full rounded-md border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent sm:text-sm";
const btn = "min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg disabled:opacity-60";

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
    setHits([]);
    setError(null);
    let problem: string | null = null;
    if (next && !next.type.startsWith("image/")) problem = "Ese archivo no es una imagen. Usa una captura en JPG, PNG o WebP.";
    else if (next && next.size === 0) problem = "La imagen está vacía o dañada. Elige otra.";
    else if (next && next.size > 8 * 1024 * 1024) problem = "La imagen pesa más de 8 MB. Usa una más pequeña.";
    if (problem) {
      setError(problem);
      setFile(null);
      setPreview(null);
      return;
    }
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
      const json = await fetchJson<{ results: TraceHit[] }>("/api/trace", { method: "POST", body });
      setHits(json.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo buscar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={box}>
      <h2 className="font-semibold">Buscar con una captura de pantalla</h2>
      <p className="text-sm text-muted">
        Elige una captura de un episodio y te decimos de qué anime es y en qué minuto aparece. Funciona mal con dibujos de
        fans o imágenes muy editadas.
      </p>
      <p className="text-xs text-muted">
        La imagen se envía al servicio externo trace.moe para compararla; no la guardamos.{" "}
        <Link href="/privacidad" className="inline-block py-2 underline">Más información</Link>
      </p>
      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border p-3 text-sm hover:border-accent">
        <span className="rounded-md bg-surface-2 px-3 py-2">Elegir imagen</span>
        <span className="min-w-0 truncate text-muted">{file ? file.name : "Ningún archivo seleccionado"}</span>
        <input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0] ?? null)} className="sr-only" />
      </label>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {preview && <img src={preview} alt="Vista previa" className="max-h-48 rounded-md" onError={() => pick(null)} />}
      <button onClick={search} disabled={!file || loading} className={btn}>
        {loading ? "Buscando…" : "Buscar con esta imagen"}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <ul className="space-y-2">
        {hits.map((h, i) => (
          <li key={i} className="rounded-md border border-border p-2 text-sm">
            <p className="font-medium">
              {h.mal_id ? <Link href={`/anime/${h.mal_id}`} className="hover:text-accent">{h.title}</Link> : h.title}
            </p>
            <p className="text-xs text-muted">
              {(h.similarity * 100).toFixed(0)}% de parecido
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
      const json = await fetchJson<{ results: Anime[] }>("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, apiKey, model, description }),
      });
      setResults(json.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo consultar a la IA.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={box}>
      <h2 className="font-semibold">Buscar describiendo lo que recuerdas (con IA)</h2>
      <p className="text-sm text-muted">
        Cuenta con tus palabras lo que recuerdas del anime y una inteligencia artificial te sugiere títulos.
      </p>
      <p className="text-xs text-muted">
        Necesitas una clave de API propia de Anthropic, OpenAI o Google (la creas en la web del proveedor y el uso se cobra
        en tu cuenta con él). La clave pasa por nuestro servidor solo para enviar esta consulta al proveedor; no la
        guardamos.{" "}
        <Link href="/privacidad" className="inline-block py-2 underline">Más información</Link>
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <select aria-label="Proveedor de IA" value={provider} onChange={(e) => setProvider(e.target.value)} className={input}>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="openai">OpenAI</option>
          <option value="gemini">Google Gemini</option>
        </select>
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Modelo (opcional, déjalo vacío)" aria-label="Modelo (opcional)" className={input} />
      </div>
      <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Tu clave de API" aria-label="Tu clave de API" autoComplete="off" className={input} />
      <label className="flex min-h-11 items-center gap-3 text-xs text-muted">
        <input className="h-5 w-5 shrink-0" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Recordar la clave en este navegador (se guarda sin cifrar en este dispositivo)
      </label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        maxLength={1500}
        aria-label="Lo que recuerdas del anime"
        placeholder="Ej.: un chico con un cuaderno que mata a gente escribiendo sus nombres…"
        className={input}
      />
      <button onClick={ask} disabled={loading || !apiKey || !description.trim()} className={btn}>
        {loading ? "Buscando…" : "Buscar con IA"}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {results && (results.length ? <AnimeGrid items={results} /> : <p className="text-sm text-muted">La IA no encontró animes que coincidan. Prueba a dar más detalles.</p>)}
    </section>
  );
}
