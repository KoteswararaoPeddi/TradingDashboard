import { Skeleton } from "@components/ui/skeleton";

/** Twelve tiles in the real `auto-fit` grid — enough to fill the fold while data lands. */
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="h-30 rounded-lg border border-border" />
      ))}
    </div>
  );
}
