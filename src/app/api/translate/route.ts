import { NextResponse, type NextRequest } from "next/server";

const MAX_CHARS = 4000;
const CHUNK = 450; // MyMemory limita ~500 caracteres por consulta

function chunk(text: string): string[] {
  const parts: string[] = [];
  let cur = "";
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if ((cur + " " + sentence).length > CHUNK && cur) {
      parts.push(cur);
      cur = sentence;
    } else cur = cur ? `${cur} ${sentence}` : sentence;
  }
  if (cur) parts.push(cur);
  return parts.flatMap((p) => (p.length > CHUNK ? p.match(new RegExp(`.{1,${CHUNK}}`, "g")) ?? [] : [p]));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.slice(0, MAX_CHARS) : "";
  if (!text.trim()) return NextResponse.json({ error: "Texto vacío." }, { status: 400 });

  try {
    const out = await Promise.all(
      chunk(text).map(async (q) => {
        const r = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=en|es`,
          { signal: AbortSignal.timeout(10000), next: { revalidate: 86400 } },
        );
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        return (j.responseData?.translatedText as string | undefined) ?? q;
      }),
    );
    return NextResponse.json({ text: out.join(" ") });
  } catch {
    return NextResponse.json({ error: "El servicio de traducción no respondió." }, { status: 502 });
  }
}
