import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Brand({
  to = "/",
  className,
  compact = false,
}: {
  to?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn("group flex items-center gap-2.5 rounded-lg", className)}
      aria-label="Waitless home"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-3">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path
            d="M6 7h6.5a3.5 3.5 0 0 1 0 7H7.5A3.5 3.5 0 0 0 4 17.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="17.5" cy="6.5" r="2" fill="currentColor" />
        </svg>
      </span>
      {!compact && (
        <span className="text-lg font-semibold tracking-tight">
          Waitless<span className="text-primary">.</span>
        </span>
      )}
    </Link>
  );
}
