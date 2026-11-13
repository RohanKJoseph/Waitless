import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ListOrdered,
  Repeat2,
  Stethoscope,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ApiStatus } from "@/components/shared/api-status";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PEAK_HOURS = [22, 34, 48, 61, 74, 88, 71, 52, 39, 24];

export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A live view of today's clinic. Metrics populate once the queue engine is running."
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/queue">
              <ListOrdered className="size-4" />
              Open queue
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Waiting now" value="—" hint="Across all doctors" icon={Users} tone="info" />
        <StatCard
          label="In consultation"
          value="—"
          hint="Rooms currently occupied"
          icon={Stethoscope}
          tone="success"
        />
        <StatCard
          label="Avg. wait"
          value="—"
          hint="Rolling 7-day average"
          icon={Clock3}
          tone="warning"
        />
        <StatCard
          label="Completed today"
          value="—"
          hint="Consultations closed"
          icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>Queue snapshot</CardTitle>
                <CardDescription>Doctor-wise load for today.</CardDescription>
              </div>
              <Badge variant="neutral">
                <Activity className="size-3" />
                Awaiting queue engine
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              ))}
            </div>
            <p className="rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              The seed created today's appointments and queue entries. Once the queue API is
              mounted, this panel fills with real tokens, positions and elapsed timers.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today at a glance</CardTitle>
              <CardDescription>Bookings by hour (local time).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-28 items-end gap-1.5">
                {PEAK_HOURS.map((height, index) => (
                  <div key={index} className="flex-1">
                    <div
                      className="w-full rounded-t-sm bg-primary/25"
                      style={{ height: `${height}%` }}
                      title={`${9 + index}:00`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>9 AM</span>
                <span>2 PM</span>
                <span>7 PM</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">System</CardTitle>
              <CardDescription>Local environment status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">API</span>
                <ApiStatus />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Realtime</span>
                <Badge variant="neutral">Socket.IO ready</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Demo data</span>
                <Badge variant="success">Seeded</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            to: "/admin/appointments",
            title: "Appointments",
            body: "Cancel, reschedule or register a walk-in.",
            icon: CalendarDays,
          },
          {
            to: "/admin/swaps",
            title: "Swap oversight",
            body: "Review pending swaps and stop abuse.",
            icon: Repeat2,
          },
          {
            to: "/admin/doctors",
            title: "Doctors",
            body: "Schedules, capacity and room assignment.",
            icon: Stethoscope,
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                <item.icon className="size-4.5" />
              </span>
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
