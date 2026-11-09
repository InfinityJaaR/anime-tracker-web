import { NextResponse, type NextRequest } from "next/server";
import { searchAnime } from "@/lib/catalog";

const MAX_PAGE = 500;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 100);
  const rawPage = sp.get("page") ?? "1";
  const genres = sp.get("genres") ?? "";

  if (!/^\d{1,3}$/.test(rawPage) || Number(rawPage) < 1 || Number(rawPage) > MAX_PAGE) {
    return NextResponse.json({ error: "Número de página no válido." }, { status: 400 });
  }
  if (genres && !/^\d{1,4}(,\d{1,4}){0,9}$/.test(genres)) {
    return NextResponse.json({ error: "Filtro de género no válido." }, { status: 400 });
  }

  try {
    return NextResponse.json(await searchAnime(q, Number(rawPage), genres || undefined));
  } catch {
    return NextResponse.json(
      { error: "El catálogo de anime no está disponible ahora. Intenta de nuevo en un momento." },
      { status: 502 },
    );
  }
}
