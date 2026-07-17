import { Skeleton } from "@components/ui/skeleton";

/** The chart grid's shape while recharts loads: one wide curve over six panels. */
export function ChartsSkeleton() {
  return (
    <>
      <Skeleton className="col-span-12 h-97.5 rounded-lg border border-border" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={i}
          className="col-span-12 h-85 rounded-lg border border-border min-[781px]:col-span-6"
        />
      ))}
    </>
  );
}
