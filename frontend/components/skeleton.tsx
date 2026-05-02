function Skel({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function CompanyCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start gap-3">
          <Skel className="h-11 w-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <Skel className="h-4 w-3/4" />
            <Skel className="h-3 w-1/2" />
          </div>
        </div>
        <div className="flex gap-1.5">
          <Skel className="h-5 w-14 rounded-full" />
          <Skel className="h-5 w-16 rounded-full" />
          <Skel className="h-5 w-12 rounded-full" />
        </div>
        <Skel className="h-4 w-1/3" />
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3">
        <div className="flex gap-2">
          <Skel className="h-5 w-24 rounded-full" />
          <Skel className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SchoolCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Skel className="h-10 w-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skel className="h-4 w-2/3" />
          <Skel className="h-3 w-1/3" />
        </div>
      </div>
      <Skel className="h-3 w-full" />
      <Skel className="h-3 w-5/6" />
      <div className="space-y-2 pt-1">
        <Skel className="h-14 w-full rounded-xl" />
        <Skel className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function StacksSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skel key={i} className={`h-7 rounded-full ${i % 3 === 0 ? 'w-24' : i % 3 === 1 ? 'w-16' : 'w-20'}`} />
      ))}
    </div>
  );
}

export function CareerPathCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <Skel className="h-10 w-10 rounded-xl" />
      <Skel className="h-5 w-3/4" />
      <Skel className="h-3 w-full" />
      <Skel className="h-3 w-2/3" />
      <div className="flex gap-2 pt-1">
        <Skel className="h-5 w-16 rounded-full" />
        <Skel className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function InternshipCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skel className="h-10 w-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skel className="h-4 w-3/4" />
          <Skel className="h-3 w-1/2" />
        </div>
        <Skel className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex gap-1.5">
        <Skel className="h-5 w-20 rounded-full" />
        <Skel className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}
