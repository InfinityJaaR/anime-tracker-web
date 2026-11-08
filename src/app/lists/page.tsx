import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RandomPick } from "@/components/random-pick";
import { isStatus, STATUSES, type ListEntry } from "@/lib/lists";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mis listas" };

export default async function ListsPage({ searchParams }: PageProps<"/lists">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const status = isStatus(raw) ? raw : "watching";

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data, error } = await supabase
    .from("list_entries")
    .select("mal_id,status,score,progress,title,image,genres")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const all = (data ?? []) as ListEntry[];
  const counts = Object.fromEntries(STATUSES.map((s) => [s.value, all.filter((e) => e.status === s.value).length]));
  const items = all.filter((e) => e.status === status);
  const planIds = all.filter((e) => e.status === "plan_to_watch").map((e) => e.mal_id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Mis listas</h1>
        <div className="flex items-center gap-2">
          <RandomPick ids={planIds} />
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/lists?status=${s.value}`}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
              s.value === status ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"
            }`}
          >
            {s.label} ({counts[s.value]})
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-muted">
          Nada aquí todavía. <Link href="/search" className="text-accent underline">Busca anime</Link> para añadir.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((e) => (
            <li key={e.mal_id}>
              <Link
                href={`/anime/${e.mal_id}`}
                className="flex gap-3 rounded-lg border border-border bg-surface p-2 hover:border-accent"
              >
                <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded bg-surface-2">
                  {e.image && <Image src={e.image} alt="" fill sizes="64px" className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium">{e.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    Ep. {e.progress}
                    {e.score ? ` · ★ ${e.score}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
