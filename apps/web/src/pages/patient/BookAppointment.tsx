import { CalendarPlus, Check, ChevronRight, Clock3, Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STEPS = ["Department", "Doctor", "Time slot", "Confirm"] as const;

export function BookAppointmentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Book an appointment"
        description="Choose a department, pick your doctor and reserve a slot. You can cancel any time before you're called."
      />

      <ol className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((step, index) => (
          <li key={step} className="flex shrink-0 items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                index === 0
                  ? "border-primary/30 bg-accent text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full text-[10px]",
                  index === 0 ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {index + 1}
              </span>
              {step}
            </div>
            {index < STEPS.length - 1 && <ChevronRight className="size-3.5 text-muted-foreground" />}
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Step 1 · Choose a department</CardTitle>
              <CardDescription>
                Departments, doctors and slot availability load from the hospital dashboard.
              </CardDescription>
            </div>
            <Badge variant="warning">Setup in progress</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "General Medicine", meta: "5 doctors · from 9:00 AM", icon: Stethoscope },
              { name: "Cardiology", meta: "2 doctors · from 9:00 AM", icon: Stethoscope },
              { name: "Orthopaedics", meta: "2 doctors · from 9:00 AM", icon: Stethoscope },
            ].map((department) => (
              <div
                key={department.name}
                className="flex items-start gap-3 rounded-xl border bg-muted/20 p-4 opacity-70"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <department.icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-medium">{department.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="size-3" />
                    {department.meta}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-dashed bg-muted/30 p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-background text-primary shadow-sm">
                <CalendarPlus className="size-4.5" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium">Booking opens with the hospital module</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  The database already contains 5 departments and 8 doctors. Once the department
                  and slot APIs land, this step becomes live and the rest of the wizard follows.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {[
                "Slot availability is server-validated",
                "Double bookings are blocked by a unique constraint",
                "Tokens are per doctor, per day",
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-muted-foreground shadow-sm"
                >
                  <Check className="size-3 text-success" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button disabled>
              Continue to doctors
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
