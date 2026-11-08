import { NextResponse, type NextRequest } from "next/server";

const MAX_BYTES = 8 * 1024 * 1024;

interface TraceResult {
  anilist?: { idMal?: number | null; title?: { romaji?: string; english?: string | null } };
  episode?: number | string | null;
  from?: number;
  similarity: number;
  image?: string;
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta la imagen." }, { status: 400 });
  }
  if (!file.type.startsWith("image/") || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Sube una imagen de máximo 8 MB." }, { status: 400 });
  }

  const upstream = await fetch("https://api.trace.moe/search?anilistInfo&cutBorders", {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: await file.arrayBuffer(),
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);

  if (!upstream) return NextResponse.json({ error: "trace.moe no respondió." }, { status: 502 });
  if (upstream.status === 429) {
    return NextResponse.json({ error: "Límite de búsquedas de trace.moe alcanzado." }, { status: 429 });
  }
  if (!upstream.ok) {
    return NextResponse.json({ error: `trace.moe respondió ${upstream.status}.` }, { status: 502 });
  }

  const json = (await upstream.json()) as { result?: TraceResult[] };
  const results = (json.result ?? []).slice(0, 5).map((r) => ({
    mal_id: r.anilist?.idMal ?? null,
    title: r.anilist?.title?.english || r.anilist?.title?.romaji || "Desconocido",
    episode: r.episode ?? null,
    at: r.from ?? null,
    similarity: r.similarity,
    preview: r.image ?? null,
  }));
  return NextResponse.json({ results });
}
