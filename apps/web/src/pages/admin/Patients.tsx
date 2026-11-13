import { Users } from "lucide-react";
import { CardEmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export function PatientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Look up a patient's visits, update contact details and review no-show history."
      />

      <CardEmptyState
        icon={Users}
        title="Patient directory is next"
        description="Six demo patients are seeded, including one with a pending swap request. Phone numbers are the unique identifier today; OTP verification can be layered on later without changing this screen."
      />
    </div>
  );
}
