import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Inbox, Repeat2, Send, X } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { ApiError, api } from "@/lib/api";
import { CardEmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";

type Swap = {
  id: string;
  status: string;
  expiresAt: string;
  message: string | null;
  requesterPatientId: string;
  targetPatientId: string;
  requesterAppointment: { tokenNumber: number; slotStart: string; serviceDay: string; doctor: { fullName: string; department?: { name: string } } };
  targetAppointment: { tokenNumber: number; slotStart: string; serviceDay: string };
  requesterPatient: { fullName: string };
  targetPatient: { fullName: string };
};

function fmtSlot(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function SwapCard({ swap, kind, onRespond, onCancel, busy }: { swap: Swap; kind: "incoming" | "outgoing" | "history"; onRespond?: (action: "ACCEPT" | "REJECT") => void; onCancel?: () => void; busy: boolean }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{swap.requesterAppointment.doctor.fullName}</p>
            <p className="text-xs text-muted-foreground">{swap.requesterAppointment.doctor.department?.name ?? "Clinic"} · {swap.requesterAppointment.serviceDay}</p>
          </div>
          <Badge variant={swap.status === "PENDING" ? "warning" : swap.status === "ACCEPTED" ? "success" : "muted"}>{swap.status}</Badge>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-md bg-muted/30 p-2"><p className="text-xs text-muted-foreground">Requester</p><p>Token #{swap.requesterAppointment.tokenNumber} · {fmtSlot(swap.requesterAppointment.slotStart)}</p></div>
          <div className="rounded-md bg-muted/30 p-2"><p className="text-xs text-muted-foreground">Target</p><p>Token #{swap.targetAppointment.tokenNumber} · {fmtSlot(swap.targetAppointment.slotStart)}</p></div>
        </div>
        {swap.status === "PENDING" && <p className="text-xs text-muted-foreground">Expires: {new Date(swap.expiresAt).toLocaleString()}</p>}
        {swap.message && <p className="text-xs text-muted-foreground">Message: {swap.message}</p>}
        <div className="flex flex-wrap gap-2">
          {kind === "incoming" && swap.status === "PENDING" && onRespond && (
            <>
              <Button size="sm" disabled={busy} onClick={() => onRespond("ACCEPT")}><Check className="size-4" />Accept</Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => onRespond("REJECT")}><X className="size-4" />Reject</Button>
            </>
          )}
          {kind === "outgoing" && swap.status === "PENDING" && onCancel && (
            <Button size="sm" variant="outline" disabled={busy} onClick={onCancel}><X className="size-4" />Cancel request</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SwapRequestsPage() {
  const qc = useQueryClient();
  const { patientProfile } = useAuth();
  const swapsQ = useQuery({
    queryKey: ["swaps", "me"],
    queryFn: async () => (await api.get<{ data: { swaps: Swap[] } }>("/swaps?role=all")).data.swaps,
  });
  const respondMut = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "ACCEPT" | "REJECT" }) => (await api.patch(`/swaps/${id}/respond`, { action })),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["swaps"] }); await qc.invalidateQueries({ queryKey: ["appointments"] }); await qc.invalidateQueries({ queryKey: ["queue"] }); toast.success("Swap updated"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not update swap"),
  });
  const cancelMut = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/swaps/${id}/cancel`, {})),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["swaps"] }); toast.success("Swap cancelled"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not cancel swap"),
  });

  const myId = patientProfile?.id;
  const swaps = useMemo(() => swapsQ.data ?? [], [swapsQ.data]);
  const incoming = useMemo(() => swaps.filter((s) => s.targetPatientId === myId && s.status === "PENDING"), [swaps, myId]);
  const outgoing = useMemo(() => swaps.filter((s) => s.requesterPatientId === myId && s.status === "PENDING"), [swaps, myId]);
  const history = useMemo(() => swaps.filter((s) => s.status !== "PENDING"), [swaps]);
  const busy = respondMut.isPending || cancelMut.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Slot swaps" description="Trade appointment times with another patient — only if you both agree." />

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">How a swap stays safe</CardTitle>
          <CardDescription>Same doctor and day, eligible statuses only, one pending request at a time, and atomic exchange on acceptance.</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="incoming">
        <TabsList>
          <TabsTrigger value="incoming"><Inbox className="mr-1.5 size-3.5" />Incoming ({incoming.length})</TabsTrigger>
          <TabsTrigger value="outgoing"><Send className="mr-1.5 size-3.5" />Sent ({outgoing.length})</TabsTrigger>
          <TabsTrigger value="history"><Repeat2 className="mr-1.5 size-3.5" />History</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-3">
          {swapsQ.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : incoming.length === 0 ? <CardEmptyState icon={Inbox} title="No incoming requests" description="If another patient asks to trade slots with you, it will appear here." /> : incoming.map((s) => <SwapCard key={s.id} swap={s} kind="incoming" busy={busy} onRespond={(action) => respondMut.mutate({ id: s.id, action })} />)}
        </TabsContent>
        <TabsContent value="outgoing" className="space-y-3">
          {swapsQ.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : outgoing.length === 0 ? <CardEmptyState icon={Send} title="No sent requests" description="To propose a swap, open an eligible visit in My visits (swap flow can be initiated from eligible appointments)." /> : outgoing.map((s) => <SwapCard key={s.id} swap={s} kind="outgoing" busy={busy} onCancel={() => cancelMut.mutate(s.id)} />)}
        </TabsContent>
        <TabsContent value="history" className="space-y-3">
          {swapsQ.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : history.length === 0 ? <CardEmptyState icon={Repeat2} title="No swap history" description="Accepted, declined and expired requests will appear here." /> : history.map((s) => <SwapCard key={s.id} swap={s} kind="history" busy={busy} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
