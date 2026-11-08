import { NextResponse, type NextRequest } from "next/server";
import { searchAnime } from "@/lib/catalog";

type Provider = "anthropic" | "openai" | "gemini";

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: "claude-haiku-5-5",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
};

const SYSTEM =
  "Eres un experto en anime y manga. Dada una descripción (posiblemente vaga) de lo que el usuario recuerda, " +
  'responde SOLO con JSON: {"titles": ["título 1", ...]} con hasta 5 candidatos, del más al menos probable, ' +
  "usando el título más conocido (romaji o inglés). Sin texto adicional.";

async function ask(provider: Provider, apiKey: string, model: string, prompt: string): Promise<string> {
  const signal = AbortSignal.timeout(30000);
  if (provider === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal,
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 400, system: SYSTEM, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) throw new ProviderError(r.status);
    const j = await r.json();
    return j.content?.[0]?.text ?? "";
  }
  if (provider === "openai") {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }],
      }),
    });
    if (!r.ok) throw new ProviderError(r.status);
    const j = await r.json();
    return j.choices?.[0]?.message?.content ?? "";
  }
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      signal,
      headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );
  if (!r.ok) throw new ProviderError(r.status);
  const j = await r.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

class ProviderError extends Error {
  constructor(public status: number) {
    super(`El proveedor respondió ${status}`);
  }
}

function parseTitles(text: string): string[] {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]) as { titles?: unknown };
    return Array.isArray(parsed.titles)
      ? parsed.titles.filter((t): t is string => typeof t === "string").slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const provider = body?.provider as Provider;
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim().slice(0, 1500) : "";
  const model = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : DEFAULT_MODELS[provider];

  if (!(provider in DEFAULT_MODELS) || !apiKey || !description) {
    return NextResponse.json({ error: "Proveedor, API key y descripción son obligatorios." }, { status: 400 });
  }

  try {
    const titles = parseTitles(await ask(provider, apiKey, model, description));
    // Resolvemos cada título contra el catálogo para obtener ficha real (la key nunca se guarda ni se registra).
    const found = await Promise.all(
      titles.map((t) => searchAnime(t, 1).then((p) => p.data[0]).catch(() => undefined)),
    );
    const seen = new Set<number>();
    const results = found.filter((a): a is NonNullable<typeof a> => {
      if (!a || seen.has(a.mal_id)) return false;
      seen.add(a.mal_id);
      return true;
    });
    return NextResponse.json({ results, guessed: titles });
  } catch (e) {
    if (e instanceof ProviderError) {
      const msg = e.status === 401 || e.status === 403 ? "API key inválida o sin permisos." : e.message;
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    return NextResponse.json({ error: "No se pudo consultar al proveedor." }, { status: 502 });
  }
}
