import {
  ArrowRight,
  BellRing,
  CalendarPlus,
  ChevronRight,
  Clock3,
  ListOrdered,
  MapPin,
  Repeat2,
  Stethoscope,
  Ticket,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_ACTIONS = [
  {
    to: "/patient/book",
    label: "Book a visit",
    description: "Pick a department, doctor and slot",
    icon: CalendarPlus,
  },
  {
    to: "/patient/queue",
    label: "Check queue",
    description: "See your token and live wait",
    icon: ListOrdered,
  },
  {
    to: "/patient/appointments",
    label: "My visits",
    description: "Upcoming and past appointments",
    icon: Ticket,
  },
  {
    to: "/patient/swaps",
    label: "Swap a slot",
    description: "Trade times with another patient",
    icon: Repeat2,
  },
];

export function PatientHomePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Namaste 👋"
        description="Here's what's happening with your visits at City Care Hospital."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-primary/5 to-transparent" />
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Next appointment</CardTitle>
              <Badge variant="neutral">No active visit</Badge>
            </div>
            <CardDescription>
              When you book, your token and live queue position show up here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Stethoscope className="size-5" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium">No appointment booked yet</p>
                  <p className="text-sm text-muted-foreground">
                    Booking takes under a minute. No payment needed at this hospital.
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link to="/patient/book">
                  Book now
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Clock3, label: "Average consult", value: "12 min" },
                { icon: MapPin, label: "Hospital", value: "City Care" },
                { icon: BellRing, label: "Alerts", value: "30 min before" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/40 p-3">
                  <item.icon className="mb-2 size-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Before you visit</CardTitle>
            <CardDescription>
              A few things that make the queue move faster for everyone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              "Carry a photo ID and your previous prescriptions.",
              "Reach the desk 10 minutes before your slot to check in.",
              "Tap “I'm here” in the queue screen if you're waiting nearby.",
              "If you're running late, the desk can hold your turn once.",
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-2 text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{tip}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <action.icon className="size-4.5" />
                </span>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-3 text-sm font-medium">{action.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
