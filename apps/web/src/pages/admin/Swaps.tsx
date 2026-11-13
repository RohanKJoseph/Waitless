import { Repeat2 } from "lucide-react";
import { CardEmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export function AdminSwapsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Swap oversight"
        description="Every swap is between patients of the same doctor and requires both sides to agree."
      />

      <CardEmptyState
        icon={Repeat2}
        title="Swap monitoring arrives with the swap module"
        description="Pending, accepted and expired requests will be listed with a full audit trail. Staff can cancel an abusive request; patients can never move someone else's appointment without consent."
      />
    </div>
  );
}
