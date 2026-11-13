import { useQuery } from "@tanstack/react-query";
import { BellRing, Clock3, ListOrdered, MapPin, Timer, Users } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Appointment = { id: string; doctorId: string; serviceDay: string; tokenNumber: number; status: string; slotStart: string; doctor: { fullName: string; room?: { code: string } | null; department?: { name: string } | null } };
type QueueEntry = { id: string; position: number; status: string; estimatedStartAt: string | null; appointment: { id: string; tokenNumber: number; patient: { fullName: string } } };
type QueueData = { entries: QueueEntry[]; currentPatient: QueueEntry | null; stats: { waiting: number; avgConsultMinutes: number } };

const ACTIVE = new Set(["BOOKED", "WAITING", "NOTIFIED", "CALLED", "IN_CONSULTATION", "DELAYED"]);

export function QueueStatusPage() {
  const apptsQ = useQuery({
    queryKey: ["appointments", "me", "queue"],
    queryFn: async () => (await api.get<{ data: { appointments: Appointment[] } }>("/appointments?pageSize=50")).data.appointments,
    refetchInterval: 15000,
  });
  const active = useMemo(() => (apptsQ.data ?? []).find((a) => ACTIVE.has(a.status)) ?? null, [apptsQ.data]);

  const queueQ = useQuery({
    queryKey: ["queue", active?.doctorId, active?.serviceDay],
    queryFn: async () => (await api.get<{ data: QueueData }>(`/queue/${active!.doctorId}?date=${active!.serviceDay}`)).data,
    enabled: !!active,
    refetchInterval: 15000,
  });

  const myEntry = queueQ.data?.entries.find((e) => e.appointment.id === active?.id) ?? null;
  const nowServing = queueQ.data?.currentPatient?.appointment.tokenNumber ?? null;
  const patientsAhead = queueQ.data && myEntry ? queueQ.data.entries.filter((e) => e.position < myEntry.position && !["COMPLETED", "SKIPPED"].includes(e.status)).length : null;
  const eta = myEntry?.estimatedStartAt ? new Date(myEntry.estimatedStartAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live queue"
        description="Your token, the patients ahead of you and an estimate that updates as the clinic moves."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="gap-0 overflow-hidden p-0">
          <div className="flex items-start justify-between border-b bg-muted/40 px-5 py-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{active ? active.doctor.fullName : "No active visit"}</p>
              <p className="text-xs text-muted-foreground">{active ? `${active.doctor.department?.name ?? "Clinic"} · ${active.serviceDay}` : "Token appears after booking/check-in"}</p>
            </div>
            <Badge variant={active ? "info" : "neutral"}>{active ? active.status.replace(/_/g, " ") : "Idle"}</Badge>
          </div>

          <CardContent className="space-y-6 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Your token</p>
                <p className="text-5xl font-semibold tabular-nums">{active ? `#${active.tokenNumber}` : "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Now serving</p>
                <p className="text-2xl font-semibold tabular-nums">{nowServing ? `#${nowServing}` : "—"}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Users, label: "Ahead", value: patientsAhead != null ? String(patientsAhead) : "—" },
                { icon: Timer, label: "Est. start", value: eta ?? "—" },
                { icon: Clock3, label: "Slot", value: active ? new Date(active.slotStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/40 p-3">
                  <item.icon className="mb-2 size-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              ))}
            </div>

            {!active ? (
              <div className="flex flex-col gap-2 rounded-xl border border-dashed bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2">
                  <ListOrdered className="mt-0.5 size-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Book a slot to see your live position here.</p>
                </div>
                <Button size="sm" asChild><Link to="/patient/book">Book a visit</Link></Button>
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                {myEntry ? (
                  <p>You are at position <span className="font-medium text-foreground">{myEntry.position}</span> in the queue. Status: <span className="font-medium text-foreground">{myEntry.status.replace(/_/g, " ")}</span>.</p>
                ) : queueQ.isLoading ? (
                  <p>Loading live queue…</p>
                ) : (
                  <p>Your appointment is active. Queue details will appear when today&apos;s queue is prepared.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How the queue works</CardTitle>
              <CardDescription>What each status means for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[ ["Waiting", "You're checked in and hold a position."], ["Called", "Go to the room when called."], ["In consultation", "The doctor is with you now."], ["Delayed/Skipped", "Check in at the desk for assistance."] ].map(([status, meaning]) => (
                <div key={status} className="flex items-start justify-between gap-3">
                  <Badge variant="outline" className="shrink-0">{status}</Badge>
                  <p className="text-right text-xs leading-relaxed text-muted-foreground">{meaning}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardContent className="space-y-2 p-4">
              <p className="flex items-center gap-2 text-sm font-medium"><BellRing className="size-4 text-primary" />Live updates</p>
              <p className="text-xs leading-relaxed text-muted-foreground">This view refreshes periodically. Realtime push updates are being rolled out in upcoming phases.</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" />{active?.doctor.room?.code ? `Room ${active.doctor.room.code}` : "Check room at reception"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
