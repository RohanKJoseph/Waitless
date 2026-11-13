import { CalendarDays, Plus } from "lucide-react";
import { CardEmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export function AdminAppointmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Search by token, name or phone; cancel, reschedule or check a patient in."
        actions={
          <Button disabled>
            <Plus className="size-4" />
            Walk-in
          </Button>
        }
      />

      <CardEmptyState
        icon={CalendarDays}
        title="Appointment desk is being wired up"
        description="The demo day already has 17 appointments across 8 doctors, including in-consultation and delayed cases. This table will read them from the API and expose the front-desk actions."
      />
    </div>
  );
}
