/** Suspense fallback nativo do App Router enquanto `page.tsx` resolve as Server Actions. */
export default function ExecucaoLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
      <div className="flex items-center justify-between">
        <div className="h-6 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-36 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-24 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
