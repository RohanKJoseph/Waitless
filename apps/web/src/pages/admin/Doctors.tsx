import { Plus, Stethoscope } from "lucide-react";
import { CardEmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function DoctorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctors"
        description="Manage consultant profiles, weekly clinics, appointment capacity and room assignment."
        actions={
          <Button disabled>
            <Plus className="size-4" />
            Add doctor
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="neutral">8 doctors seeded</Badge>
        <Badge variant="neutral">Mon–Sat · 9 AM–1 PM, 5–8 PM</Badge>
        <Badge variant="neutral">Rooms OPD-1 … OPD-8</Badge>
      </div>

      <CardEmptyState
        icon={Stethoscope}
        title="Doctor management arrives with the hospital module"
        description="Create doctors, attach them to departments, set average consultation time and define morning/evening clinics. Room codes are already wired for the NXP occupancy sensors."
      />
    </div>
  );
}
