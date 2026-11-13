import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "info";
  className?: string;
}) {
  const toneClasses = {
    default: "bg-accent text-accent-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    info: "bg-info/12 text-info",
  } as const;

  return (
    <Card className={cn("gap-3 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("grid size-9 place-items-center rounded-lg", toneClasses[tone])}>
          <Icon className="size-4.5" />
        </span>
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  );
}
