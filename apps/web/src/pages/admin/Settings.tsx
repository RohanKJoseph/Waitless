import { BellRing, Cpu, Hospital, TimerReset } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Hospital profile, queue rules and integrations. Values shown here come from the API configuration."
        actions={<Badge variant="warning">Read-only in this phase</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Hospital className="size-4 text-primary" />
              Hospital profile
            </CardTitle>
            <CardDescription>Shown to patients on booking and token slips.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Name", "City Care Hospital"],
              ["Timezone", "Asia/Kolkata"],
              ["Booking horizon", "7 days"],
              ["QR code", "Not generated yet"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TimerReset className="size-4 text-primary" />
              Queue rules
            </CardTitle>
            <CardDescription>Defaults from <code className="text-xs">.env</code>.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Grace period", "10 minutes after call"],
              ["Delay before skip", "10 more minutes"],
              ["Skip policy", "Requeue to end"],
              ["Ready alert", "30 minutes before turn"],
              ["Swap cut-off", "60 minutes before slot"],
            ].map(([label, value], index, rows) => (
              <div key={label}>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
                {index < rows.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRing className="size-4 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Channels that are wired up.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">In-app</span>
              <Badge variant="success">Ready</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Browser push</span>
              <Badge variant="neutral">Phase 7</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">SMS / WhatsApp</span>
              <Badge variant="neutral">Later</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">OTP verification</span>
              <Badge variant="neutral">Deferred</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="size-4 text-primary" />
              Hardware
            </CardTitle>
            <CardDescription>Room occupancy bridge.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">MQTT broker</span>
              <Badge variant="success">mosquitto:1883</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Auto-complete</span>
              <Badge variant="neutral">Off (staff confirms)</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rooms registered</span>
              <span className="font-medium">8</span>
            </div>
            <p className="rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              The NXP FRDM-MCXN236 board publishes occupancy events. The backend treats them as
              hints and always lets staff override.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
