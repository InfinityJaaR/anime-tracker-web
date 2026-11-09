import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Iniciar sesión o crear cuenta" };

const REASONS: Record<string, string> = {
  "/lists": "Inicia sesión o crea una cuenta para ver tus listas.",
  "/stats": "Inicia sesión o crea una cuenta para ver tus estadísticas.",
  "/friends": "Inicia sesión o crea una cuenta para ver a tus amigos.",
  "/anime": "Inicia sesión o crea una cuenta para guardar este anime en tus listas.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const next = safeNext(one(sp.next));
  const mode = one(sp.mode) === "signup" ? "up" : "in";
  const reasonKey = one(sp.next) ? Object.keys(REASONS).find((k) => next.startsWith(k)) : undefined;

  return (
    <div className="mx-auto max-w-sm space-y-4">
      {reasonKey && (
        <p role="status" className="rounded-md border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
          {REASONS[reasonKey]}
        </p>
      )}
      <AuthForm initialMode={mode} next={next} />
    </div>
  );
}
