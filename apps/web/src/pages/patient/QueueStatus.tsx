import { BellRing, Clock3, ListOrdered, MapPin, Timer, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function QueueStatusPage() {
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
              <p className="text-sm font-medium">No active visit</p>
              <p className="text-xs text-muted-foreground">Token appears after check-in</p>
            </div>
            <Badge variant="neutral">Idle</Badge>
          </div>

          <CardContent className="space-y-6 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Your token</p>
                <p className="text-5xl font-semibold tabular-nums text-muted-foreground/40">—</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Now serving
                </p>
                <p className="text-2xl font-semibold tabular-nums text-muted-foreground/40">—</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-0 rounded-full bg-primary" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 patients ahead</span>
                <span>Waiting estimate</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Users, label: "Ahead", value: "—" },
                { icon: Timer, label: "Est. wait", value: "—" },
                { icon: Clock3, label: "Slot", value: "—" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/40 p-3">
                  <item.icon className="mb-2 size-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-dashed bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <ListOrdered className="mt-0.5 size-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Book a slot to see your live position here.
                </p>
              </div>
              <Button size="sm" asChild>
                <Link to="/patient/book">Book a visit</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How the queue works</CardTitle>
              <CardDescription>What each status means for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ["Waiting", "You're checked in and hold a position."],
                ["Notified", "We alerted you and the doctor will call you soon."],
                ["Called", "Go to the room. You have a 10-minute grace period."],
                ["In consultation", "The doctor is with you now."],
                ["Delayed", "You missed the call — check in at the desk."],
              ].map(([status, meaning]) => (
                <div key={status} className="flex items-start justify-between gap-3">
                  <Badge variant="outline" className="shrink-0">
                    {status}
                  </Badge>
                  <p className="text-right text-xs leading-relaxed text-muted-foreground">
                    {meaning}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardContent className="space-y-2 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <BellRing className="size-4 text-primary" />
                Alerts are switched on
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                You'll get a heads-up 30 minutes before your turn and another when you're next.
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                City Care Hospital · Ground floor, Block A
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
