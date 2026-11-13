import { useQuery } from "@tanstack/react-query";
import { Activity, CalendarDays, CheckCircle2, ChevronRight, ListOrdered, Repeat2, Stethoscope, Users } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ApiStatus } from "@/components/shared/api-status";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const PEAK_HOURS = [22, 34, 48, 61, 74, 88, 71, 52, 39, 24];

type Appointment = { status: string; slotStart: string; doctorId: string; doctor: { fullName: string } };

export function AdminDashboardPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const apptsQ = useQuery({
    queryKey: ["appointments", "admin", "dashboard", today],
    queryFn: async () => (await api.get<{ data: { appointments: Appointment[] } }>(`/appointments?date=${today}&pageSize=200`)).data.appointments,
    refetchInterval: 15000,
  });
  const items = useMemo(() => apptsQ.data ?? [], [apptsQ.data]);
  const stats = useMemo(() => {
    const waiting = items.filter((a) => ["WAITING", "NOTIFIED", "DELAYED", "BOOKED"].includes(a.status)).length;
    const inConsult = items.filter((a) => a.status === "IN_CONSULTATION").length;
    const completed = items.filter((a) => a.status === "COMPLETED").length;
    const called = items.filter((a) => a.status === "CALLED").length;
    const byDoctor = new Map<string, { name: string; active: number }>();
    for (const a of items) {
      const cur = byDoctor.get(a.doctorId) ?? { name: a.doctor.fullName, active: 0 };
      if (["WAITING", "NOTIFIED", "DELAYED", "BOOKED", "CALLED", "IN_CONSULTATION"].includes(a.status)) cur.active++;
      byDoctor.set(a.doctorId, cur);
    }
    return { waiting: waiting + called, inConsult, completed, doctors: Array.from(byDoctor.values()).sort((a, b) => b.active - a.active).slice(0, 5) };
  }, [items]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Live view of today's clinic activity."
        actions={<Button variant="outline" asChild><Link to="/admin/queue"><ListOrdered className="size-4" />Open queue</Link></Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Waiting now" value={String(stats.waiting)} hint="Active in queue flow" icon={Users} tone="info" />
        <StatCard label="In consultation" value={String(stats.inConsult)} hint="Rooms currently active" icon={Stethoscope} tone="success" />
        <StatCard label="Today's appointments" value={String(items.length)} hint={`For ${today}`} icon={CalendarDays} tone="warning" />
        <StatCard label="Completed today" value={String(stats.completed)} hint="Consultations closed" icon={CheckCircle2} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>Queue snapshot</CardTitle>
                <CardDescription>Doctor-wise active load for today.</CardDescription>
              </div>
              <Badge variant="neutral"><Activity className="size-3" />Live polling</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {apptsQ.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : stats.doctors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active appointments for today yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.doctors.map((d) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{d.name}</p>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/50" style={{ width: `${Math.min(100, d.active * 15)}%` }} /></div>
                    </div>
                    <Badge variant="muted">{d.active} active</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today at a glance</CardTitle>
              <CardDescription>Bookings distribution (illustrative).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-28 items-end gap-1.5">
                {PEAK_HOURS.map((height, index) => (
                  <div key={index} className="flex-1"><div className="w-full rounded-t-sm bg-primary/25" style={{ height: `${height}%` }} title={`${9 + index}:00`} /></div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>9 AM</span><span>2 PM</span><span>7 PM</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">System</CardTitle><CardDescription>Local environment status.</CardDescription></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">API</span><ApiStatus /></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Realtime</span><Badge variant="success">Socket.IO active</Badge></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Hardware</span><Badge variant="neutral">MQTT ingest ready</Badge></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[{ to: "/admin/appointments", title: "Appointments", body: "Cancel, reschedule or register a walk-in.", icon: CalendarDays }, { to: "/admin/swaps", title: "Swap oversight", body: "Review pending swaps and stop abuse.", icon: Repeat2 }, { to: "/admin/doctors", title: "Doctors", body: "Schedules, capacity and room assignment.", icon: Stethoscope }].map((item) => (
          <Link key={item.to} to={item.to} className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground"><item.icon className="size-4.5" /></span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-3 text-sm font-medium">{item.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
