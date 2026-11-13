import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ListOrdered, PhoneCall, Play, RefreshCw, SkipForward, UserCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError, api } from "@/lib/api";
import { listDoctors, type Doctor } from "@/lib/admin-api";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type QueueEntry = {
  id: string;
  position: number;
  status: string;
  estimatedStartAt: string | null;
  calledAt: string | null;
  appointment: {
    tokenNumber: number;
    slotStart: string;
    patient: { fullName: string; phone: string };
  };
};

type QueueData = {
  doctor: { id: string; fullName: string };
  date: string;
  entries: QueueEntry[];
  currentPatient: QueueEntry | null;
  stats: { waiting: number; called: number; inConsultation: number; completed: number; skipped: number; avgConsultMinutes: number; patientsAhead: number };
};

function statusVariant(status: string): "default" | "success" | "warning" | "danger" | "info" | "muted" {
  if (status === "COMPLETED") return "success";
  if (["SKIPPED", "CANCELLED", "NO_SHOW"].includes(status)) return "danger";
  if (["CALLED", "DELAYED"].includes(status)) return "warning";
  if (status === "IN_CONSULTATION") return "info";
  return "muted";
}

export function QueueManagementPage() {
  const qc = useQueryClient();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [doctorId, setDoctorId] = useState("");

  const doctorsQ = useQuery({ queryKey: ["doctors", "queue"], queryFn: async () => (await listDoctors({ includeInactive: false })).doctors });
  const doctors = doctorsQ.data ?? [];
  const selectedDoctorId = doctorId || doctors[0]?.id || "";

  const queueQ = useQuery({
    queryKey: ["queue", selectedDoctorId, date],
    queryFn: async () => (await api.get<{ data: QueueData }>(`/queue/${selectedDoctorId}?date=${date}`)).data,
    enabled: !!selectedDoctorId,
    refetchInterval: 15000,
  });

  const action = useMutation({
    mutationFn: async ({ id, kind }: { id: string; kind: "call" | "start" | "complete" | "skip" | "arrive" }) =>
      (await api.patch(`/queue/entries/${id}/${kind}`, kind === "skip" ? { reason: "Skipped by staff" } : {})),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["queue"] });
      await qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Queue action failed"),
  });

  const q = queueQ.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Queue management"
        description="Call, start, complete and manage the live queue for each doctor."
        actions={
          <Button variant="outline" onClick={() => void qc.invalidateQueries({ queryKey: ["queue"] })}><RefreshCw className="size-4" />Refresh</Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={selectedDoctorId} onValueChange={setDoctorId}>
          <SelectTrigger className="w-64"><SelectValue placeholder={doctorsQ.isLoading ? "Loading doctors…" : "Select doctor"} /></SelectTrigger>
          <SelectContent>{doctors.map((d: Doctor) => <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
        {q && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="muted">Waiting: {q.stats.waiting}</Badge>
            <Badge variant="warning">Called: {q.stats.called}</Badge>
            <Badge variant="info">In consult: {q.stats.inConsultation}</Badge>
            <Badge variant="success">Completed: {q.stats.completed}</Badge>
            <Badge variant="danger">Skipped: {q.stats.skipped}</Badge>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {!selectedDoctorId ? (
            <div className="p-6 text-sm text-muted-foreground">Select a doctor to view their queue.</div>
          ) : queueQ.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading queue…</div>
          ) : !q || q.entries.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground flex items-center gap-2"><ListOrdered className="size-4" />No queue entries for this day.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pos</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.position}</TableCell>
                    <TableCell>#{e.appointment.tokenNumber}</TableCell>
                    <TableCell><div>{e.appointment.patient.fullName}</div><div className="text-xs text-muted-foreground">{e.appointment.patient.phone}</div></TableCell>
                    <TableCell>{new Date(e.appointment.slotStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</TableCell>
                    <TableCell><Badge variant={statusVariant(e.status)}>{e.status.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.estimatedStartAt ? new Date(e.estimatedStartAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {["WAITING", "NOTIFIED", "DELAYED", "BOOKED"].includes(e.status) && (
                          <Button size="sm" variant="outline" disabled={action.isPending} onClick={() => action.mutate({ id: e.id, kind: "call" })}><PhoneCall className="size-4" />Call</Button>
                        )}
                        {e.status === "CALLED" && (
                          <Button size="sm" variant="outline" disabled={action.isPending} onClick={() => action.mutate({ id: e.id, kind: "start" })}><Play className="size-4" />Start</Button>
                        )}
                        {e.status === "IN_CONSULTATION" && (
                          <Button size="sm" variant="outline" disabled={action.isPending} onClick={() => action.mutate({ id: e.id, kind: "complete" })}><CheckCircle2 className="size-4" />Complete</Button>
                        )}
                        {["CALLED", "DELAYED"].includes(e.status) && (
                          <Button size="sm" variant="ghost" disabled={action.isPending} onClick={() => action.mutate({ id: e.id, kind: "skip" })}><SkipForward className="size-4" /></Button>
                        )}
                        {e.status === "SKIPPED" && (
                          <Button size="sm" variant="ghost" disabled={action.isPending} onClick={() => action.mutate({ id: e.id, kind: "arrive" })}><UserCheck className="size-4" />Requeue</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
