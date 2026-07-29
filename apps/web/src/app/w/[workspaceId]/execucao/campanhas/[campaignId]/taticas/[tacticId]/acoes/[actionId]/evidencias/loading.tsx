export default function EvidenciasLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-40 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-16 animate-pulse rounded-md bg-muted" />
      <div className="h-16 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
