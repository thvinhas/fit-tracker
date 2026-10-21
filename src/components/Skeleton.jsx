const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-surface3 ${className}`} />
);

export const CardSkeleton = ({ className = "" }) => (
  <div className={`p-4 rounded-2xl bg-surface2 flex items-center gap-3 ${className}`}>
    <div className="flex-1 min-w-0 space-y-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
    <Skeleton className="h-6 w-16 shrink-0" />
  </div>
);

export const ListSkeleton = ({ rows = 3 }) => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: rows }, (_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export default Skeleton;
