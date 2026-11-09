import { NextResponse, type NextRequest } from "next/server";

const MAX_BYTES = 8 * 1024 * 1024;

interface TraceResult {
  anilist?: { idMal?: number | null; title?: { romaji?: string; english?: string | null } };
  episode?: number | string | null;
  from?: number;
  similarity: number;
  image?: string;
}

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File) || file.size === 0) return fail("Elige una imagen primero.", 400);
  if (!file.type.startsWith("image/")) {
    return fail("Ese archivo no es una imagen. Usa una captura en JPG, PNG o WebP.", 400);
  }
  if (file.size > MAX_BYTES) return fail("La imagen pesa más de 8 MB. Usa una más pequeña.", 400);

  const upstream = await fetch("https://api.trace.moe/search?anilistInfo&cutBorders", {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: await file.arrayBuffer(),
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);

  if (!upstream) return fail("El servicio de búsqueda por imagen no respondió. Intenta de nuevo.", 502);
  if (upstream.status === 429 || upstream.status === 402) {
    return fail("Se agotaron las búsquedas por imagen por ahora. Intenta más tarde.", 429);
  }
  if (upstream.status >= 400 && upstream.status < 500) {
    return fail("No se pudo leer la imagen. Prueba con otra captura del episodio.", 400);
  }
  if (!upstream.ok) return fail("El servicio de búsqueda por imagen falló. Intenta de nuevo.", 502);

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
