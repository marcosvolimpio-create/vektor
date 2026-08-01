export default function EtapaLoading() {
  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-40 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
