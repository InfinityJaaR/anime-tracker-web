"use client";

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
      <p className="mt-2 text-sm text-muted">{error.message || "Error inesperado."}</p>
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
