import { useReadiness } from "@/hooks/use-health";
import { cn } from "@/lib/utils";

/**
 * Small honesty indicator used in the footer while the product is being built:
 * it proves the web app is actually talking to the API.
 */
export function ApiStatus({ className }: { className?: string }) {
  const { data, isPending, isError } = useReadiness();

  const state = isPending
    ? { color: "bg-muted-foreground/40", label: "Checking API" }
    : isError || data?.status !== "ready"
      ? { color: "bg-destructive", label: "API degraded" }
      : { color: "bg-success", label: "API online" };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs text-muted-foreground",
        className,
      )}
      title={data ? `db: ${data.checks.db} · redis: ${data.checks.redis}` : undefined}
    >
      <span className={cn("size-2 rounded-full", state.color)} aria-hidden="true" />
      {state.label}
    </span>
  );
}
