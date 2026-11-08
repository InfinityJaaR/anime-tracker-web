import { GridSkeleton } from "@/components/anime-card";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-48 animate-pulse rounded bg-surface-2" />
      <GridSkeleton />
    </div>
  );
}
