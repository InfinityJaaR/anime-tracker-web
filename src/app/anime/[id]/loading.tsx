export default function Loading() {
  return (
    <div className="grid animate-pulse gap-6 md:grid-cols-[240px_1fr]" aria-busy="true" aria-label="Cargando anime">
      <div className="mx-auto aspect-[2/3] w-48 rounded-lg bg-surface-2 md:w-full" />
      <div className="space-y-4">
        <div className="h-8 w-2/3 rounded bg-surface-2" />
        <div className="h-4 w-1/2 rounded bg-surface-2" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-surface-2" />
          <div className="h-6 w-20 rounded-full bg-surface-2" />
        </div>
        <div className="h-24 rounded-lg bg-surface-2" />
        <div className="h-32 rounded bg-surface-2" />
      </div>
    </div>
  );
}
