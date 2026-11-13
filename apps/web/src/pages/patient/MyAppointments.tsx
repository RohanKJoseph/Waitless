import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarX2, Ticket, X } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ApiError, api } from "@/lib/api";
import { CardEmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Appointment = {
  id: string;
  tokenNumber: number;
  serviceDay: string;
  slotStart: string;
  status: string;
  doctor: { fullName: string; department?: { name: string } | null; room?: { code: string } | null };
  department?: { name: string } | null;
  cancelReason?: string | null;
};

const UPCOMING = new Set(["BOOKED", "WAITING", "NOTIFIED", "CALLED", "IN_CONSULTATION", "DELAYED"]);
const CANCELLED = new Set(["CANCELLED", "SKIPPED", "NO_SHOW"]);

function statusVariant(status: string): "default" | "success" | "warning" | "danger" | "info" | "muted" {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED" || status === "NO_SHOW" || status === "SKIPPED") return "danger";
  if (status === "DELAYED" || status === "CALLED") return "warning";
  if (status === "IN_CONSULTATION") return "info";
  return "muted";
}

function canCancel(status: string) {
  return ["BOOKED", "WAITING", "NOTIFIED", "DELAYED"].includes(status);
}

function AppointmentCard({ appt, onCancel, cancelling }: { appt: Appointment; onCancel: () => void; cancelling: boolean }) {
  const time = new Date(appt.slotStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Token #{appt.tokenNumber}</span>
            <Badge variant={statusVariant(appt.status)}>{appt.status.replace(/_/g, " ")}</Badge>
          </div>
          <p className="text-sm">{appt.doctor.fullName} · {appt.department?.name ?? appt.doctor.department?.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{appt.serviceDay} · {time}{appt.doctor.room?.code ? ` · Room ${appt.doctor.room.code}` : ""}</p>
          {appt.cancelReason && <p className="text-xs text-muted-foreground">Reason: {appt.cancelReason}</p>}
        </div>
        {canCancel(appt.status) && (
          <Button variant="outline" size="sm" disabled={cancelling} onClick={onCancel}>
            <X className="size-4" />Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function MyAppointmentsPage() {
  const qc = useQueryClient();
  const apptsQ = useQuery({
    queryKey: ["appointments", "me"],
    queryFn: async () => (await api.get<{ data: { appointments: Appointment[] } }>("/appointments?pageSize=100")).data.appointments,
  });
  const cancelMut = useMutation({
    mutationFn: async (id: string) => (await api.patch<{ data: { appointment: Appointment } }>(`/appointments/${id}/cancel`, {})).data.appointment,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment cancelled");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not cancel appointment"),
  });

  const groups = useMemo(() => {
    const items = apptsQ.data ?? [];
    return {
      upcoming: items.filter((a) => UPCOMING.has(a.status)),
      past: items.filter((a) => a.status === "COMPLETED"),
      cancelled: items.filter((a) => CANCELLED.has(a.status)),
    };
  }, [apptsQ.data]);

  function renderList(list: Appointment[], emptyTitle: string, emptyDesc: string) {
    if (apptsQ.isLoading) return <p className="text-sm text-muted-foreground">Loading appointments…</p>;
    if (list.length === 0) {
      return (
        <CardEmptyState
          icon={list === groups.upcoming ? Ticket : CalendarX2}
          title={emptyTitle}
          description={emptyDesc}
          action={list === groups.upcoming ? <Button asChild size="sm"><Link to="/patient/book">Book an appointment</Link></Button> : undefined}
        />
      );
    }
    return (
      <div className="space-y-3">
        {list.map((appt) => (
          <AppointmentCard key={appt.id} appt={appt} cancelling={cancelMut.isPending} onCancel={() => cancelMut.mutate(appt.id)} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My visits"
        description="Every appointment, with its token and current status."
        actions={<Button asChild><Link to="/patient/book">Book a visit</Link></Button>}
      />

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {renderList(groups.upcoming, "No upcoming appointments", "Once you book, your token and live queue position appear here.")}
        </TabsContent>
        <TabsContent value="past">
          {renderList(groups.past, "No past visits yet", "Completed consultations will be listed here for your records.")}
        </TabsContent>
        <TabsContent value="cancelled">
          {renderList(groups.cancelled, "Nothing cancelled", "Cancelled appointments stay visible here, with the reason if the hospital added one.")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
