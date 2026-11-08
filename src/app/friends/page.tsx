import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AddFriendForm, RequestButtons } from "@/components/friend-actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Amigos" };

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const me = auth.user.id;

  const { data: rows, error } = await supabase.from("friendships").select("requester,addressee,status");
  if (error) throw new Error(error.message);
  const ids = [...new Set((rows ?? []).flatMap((r) => [r.requester, r.addressee]))].filter((i) => i !== me);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id,username").in("id", ids)
    : { data: [] };
  const name = (id: string) => profiles?.find((p) => p.id === id)?.username ?? "?";

  const friends = (rows ?? []).filter((r) => r.status === "accepted").map((r) => (r.requester === me ? r.addressee : r.requester));
  const incoming = (rows ?? []).filter((r) => r.status === "pending" && r.addressee === me);
  const outgoing = (rows ?? []).filter((r) => r.status === "pending" && r.requester === me);
  const card = "rounded-lg border border-border bg-surface p-4";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Amigos</h1>
      <section className={card}>
        <h2 className="mb-2 font-semibold">Agregar amigo</h2>
        <AddFriendForm />
      </section>

      {incoming.length > 0 && (
        <section className={card}>
          <h2 className="mb-2 font-semibold">Solicitudes recibidas</h2>
          <ul className="space-y-2">
            {incoming.map((r) => (
              <li key={r.requester} className="flex items-center justify-between text-sm">
                {name(r.requester)} <RequestButtons requester={r.requester} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={card}>
        <h2 className="mb-2 font-semibold">Tus amigos</h2>
        {friends.length === 0 ? (
          <p className="text-sm text-muted">Aún no tienes amigos agregados.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {friends.map((id) => (
              <li key={id}>
                <Link href={`/friends/${name(id)}`} className="block rounded-md border border-border p-3 text-sm hover:border-accent">
                  {name(id)}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {outgoing.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            Pendientes: {outgoing.map((r) => name(r.addressee)).join(", ")}
          </p>
        )}
      </section>
    </div>
  );
}
