"use client";

function friendlyMessage(message: string): string {
  if (/URL and Key are required/i.test(message))
    return "Supabase no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local y reinicia el servidor.";
  if (/Could not find the table|schema cache|does not exist/i.test(message))
    return "Faltan las tablas en Supabase. Ejecuta supabase/migrations/0001_init.sql en el SQL Editor.";
  if (/Tenrai|respondió|catálogo|fetch failed|ECONN|timeout/i.test(message))
    return "El catálogo de anime no está disponible ahora. Intenta de nuevo en un momento.";
  return message || "Ocurrió un error inesperado. Intenta de nuevo.";
}

export function ErrorView({
  error,
  reset,
  title = "Algo salió mal",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-border bg-surface p-6 text-center">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 break-words text-sm text-muted">{friendlyMessage(error.message)}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg"
      >
        Reintentar
      </button>
    </div>
  );
}
