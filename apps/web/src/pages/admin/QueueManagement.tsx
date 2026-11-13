import { ListOrdered } from "lucide-react";
import { CardEmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";

export function QueueManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Queue management"
        description="Call the next patient, start or finish a consultation, and handle delayed patients with a grace period."
        actions={
          <Badge variant="neutral">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Live updates pending
          </Badge>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Call next", "Moves the next waiting token to CALLED and starts a 10-minute grace timer."],
          ["Start", "Opens a consultation record and moves the patient to IN_CONSULTATION."],
          ["Complete", "Closes the consultation, records duration and recalculates every ETA behind it."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>

      <CardEmptyState
        icon={ListOrdered}
        title="Queue engine lands in phase 4"
        description="A full doctor-wise queue with drag-free ordering, elapsed timers, skip and requeue is next. The state machine, grace-period rules and ETA inputs are already defined in the shared package."
      />
    </div>
  );
}
