import { useQuery } from "@tanstack/react-query";
import { BellRing, Cpu, Hospital, QrCode, TimerReset } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type QrData = { scanUrl: string; qrDataUrl: string; token: string };

export function SettingsPage() {
  const qrQ = useQuery({
    queryKey: ["qr", "hospital"],
    queryFn: async () => (await api.get<{ data: QrData }>("/qr/hospital")).data,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Hospital profile, queue rules and integrations."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><QrCode className="size-4 text-primary" />Booking QR code</CardTitle>
            <CardDescription>Printable QR for on-site check-in/booking. Signed and time-limited.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {qrQ.isLoading ? (
              <p className="text-sm text-muted-foreground">Generating QR…</p>
            ) : qrQ.data ? (
              <>
                <img src={qrQ.data.qrDataUrl} alt="Hospital booking QR code" className="h-48 w-48 rounded-lg border bg-white p-2" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Scan to book</p>
                  <p className="text-muted-foreground break-all">{qrQ.data.scanUrl}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.print()}>Print</Button>
                    <Button size="sm" variant="outline" asChild><a href={qrQ.data.scanUrl} target="_blank" rel="noreferrer">Open link</a></Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Could not load QR code.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Hospital className="size-4 text-primary" />Hospital profile</CardTitle>
            <CardDescription>Shown to patients on booking and token slips.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[ ["Name", "City Care Hospital"], ["Timezone", "Asia/Kolkata"], ["Booking horizon", "7 days"], ["QR code", qrQ.data ? "Active" : "—"] ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TimerReset className="size-4 text-primary" />Queue rules</CardTitle>
            <CardDescription>Defaults from environment configuration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[ ["Grace period", "10 minutes after call"], ["Delay before skip", "10 more minutes"], ["Skip policy", "Requeue to end"], ["Ready alert", "30 minutes before turn"], ["Swap cut-off", "60 minutes before slot"] ].map(([label, value], index, rows) => (
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
            <CardTitle className="flex items-center gap-2 text-base"><BellRing className="size-4 text-primary" />Notifications</CardTitle>
            <CardDescription>Channel rollout status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">In-app</span><Badge variant="success">Active</Badge></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Browser push</span><Badge variant="neutral">Planned</Badge></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">SMS / WhatsApp</span><Badge variant="neutral">Stub</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Cpu className="size-4 text-primary" />Hardware</CardTitle>
            <CardDescription>Room occupancy bridge.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">MQTT broker</span><Badge variant="success">mosquitto:1883</Badge></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Auto-complete</span><Badge variant="neutral">Staff confirm</Badge></div>
            <p className="rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">Hardware occupancy events are treated as hints with staff override.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
