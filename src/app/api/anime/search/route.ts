import { NextResponse, type NextRequest } from "next/server";
import { searchAnime } from "@/lib/catalog";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const genres = sp.get("genres") ?? undefined;
  try {
    return NextResponse.json(await searchAnime(q, page, genres));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
