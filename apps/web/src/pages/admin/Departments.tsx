import { Building2, Plus } from "lucide-react";
import { CardEmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export function DepartmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Clinical units patients choose from when booking. Deactivating a department hides it from new bookings."
        actions={
          <Button disabled>
            <Plus className="size-4" />
            Add department
          </Button>
        }
      />

      <CardEmptyState
        icon={Building2}
        title="Department management is next"
        description="The database already holds General Medicine, Cardiology, Orthopaedics, Paediatrics and Dermatology. This screen adds create, edit and deactivate once the API is mounted."
      />
    </div>
  );
}
