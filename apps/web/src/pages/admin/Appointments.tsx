import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, RefreshCw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError, api } from "@/lib/api";
import { listDoctors, type Doctor } from "@/lib/admin-api";
import { CardEmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Appointment = {
  id: string;
  tokenNumber: number;
  serviceDay: string;
  slotStart: string;
  status: string;
  source: string;
  patient: { fullName: string; phone: string };
  doctor: { id: string; fullName: string; room?: { code: string } | null };
  department: { name: string };
};

function statusVariant(status: string): "default" | "success" | "warning" | "danger" | "info" | "muted" {
  if (status === "COMPLETED") return "success";
  if (["CANCELLED", "NO_SHOW", "SKIPPED"].includes(status)) return "danger";
  if (["DELAYED", "CALLED"].includes(status)) return "warning";
  if (status === "IN_CONSULTATION") return "info";
  return "muted";
}

function WalkInDialog({ doctors, onDone }: { doctors: Doctor[]; onDone: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slotStart, setSlotStart] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const slotsQ = useQuery({
    queryKey: ["availability", doctorId, date, "walkin"],
    queryFn: async () => (await api.get<{ data: { slots: { start: string; label: string; isBooked: boolean; isPast: boolean }[] } }>(`/doctors/${doctorId}/availability?date=${date}`)).data.slots,
    enabled: open && !!doctorId,
  });
  const mut = useMutation({
    mutationFn: async () => (await api.post<{ data: { appointment: Appointment } }>("/appointments/walk-in", {
      doctorId,
      slotStart,
      patient: { fullName: name, phone },
    })).data.appointment,
    onSuccess: async () => {
      await onDone();
      toast.success("Walk-in registered");
      setOpen(false);
      setName(""); setPhone(""); setSlotStart("");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not register walk-in"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="size-4" />Walk-in</Button></DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Register walk-in</DialogTitle>
          <DialogDescription>Create a booking and token for a patient at the front desk.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Patient name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" /></div>
          </div>
          <div className="space-y-1.5"><Label>Doctor</Label>
            <Select value={doctorId} onValueChange={(v) => { setDoctorId(v); setSlotStart(""); }}>
              <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
              <SelectContent>{doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSlotStart(""); }} /></div>
          <div className="space-y-1.5"><Label>Slot</Label>
            <Select value={slotStart} onValueChange={setSlotStart}>
              <SelectTrigger><SelectValue placeholder={slotsQ.isLoading ? "Loading slots…" : "Select slot"} /></SelectTrigger>
              <SelectContent>
                {(slotsQ.data ?? []).filter((s) => !s.isBooked && !s.isPast).map((s) => <SelectItem key={s.start} value={s.start}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={mut.isPending || !doctorId || !slotStart || !name || !phone} onClick={() => mut.mutate()}>{mut.isPending ? "Saving…" : "Create walk-in"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminAppointmentsPage() {
  const qc = useQueryClient();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [q, setQ] = useState("");
  const [doctorId, setDoctorId] = useState("all");
  const [status, setStatus] = useState("all");

  const doctorsQ = useQuery({ queryKey: ["doctors", "admin", "all"], queryFn: async () => (await listDoctors({ includeInactive: false })).doctors });
  const apptsQ = useQuery({
    queryKey: ["appointments", "admin", date, q, doctorId, status],
    queryFn: async () => {
      const params = new URLSearchParams({ date, pageSize: "100" });
      if (q) params.set("q", q);
      if (doctorId !== "all") params.set("doctorId", doctorId);
      if (status !== "all") params.set("status", status);
      return (await api.get<{ data: { appointments: Appointment[] } }>(`/appointments?${params.toString()}`)).data.appointments;
    },
  });
  const cancelMut = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/appointments/${id}/cancel`, {})),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["appointments"] }); toast.success("Appointment cancelled"); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not cancel"),
  });
  const refresh = async () => { await qc.invalidateQueries({ queryKey: ["appointments"] }); };

  const doctors = doctorsQ.data ?? [];
  const items = apptsQ.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Search by token, name or phone; cancel or register walk-ins."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void refresh()}><RefreshCw className="size-4" />Refresh</Button>
            {doctors.length > 0 && <WalkInDialog doctors={doctors} onDone={refresh} />}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Token, name, phone" className="pl-9 w-56" /></div>
        <Select value={doctorId} onValueChange={setDoctorId}><SelectTrigger className="w-48"><SelectValue placeholder="All doctors" /></SelectTrigger><SelectContent><SelectItem value="all">All doctors</SelectItem>{doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{["BOOKED","WAITING","NOTIFIED","CALLED","IN_CONSULTATION","COMPLETED","DELAYED","SKIPPED","CANCELLED","NO_SHOW"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}</SelectContent></Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {apptsQ.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading appointments…</div>
          ) : items.length === 0 ? (
            <div className="p-6"><CardEmptyState icon={CalendarDays} title="No appointments found" description="Try changing the date or filters, or register a walk-in." /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">#{a.tokenNumber}</TableCell>
                    <TableCell><div>{a.patient.fullName}</div><div className="text-xs text-muted-foreground">{a.patient.phone}</div></TableCell>
                    <TableCell><div>{a.doctor.fullName}</div><div className="text-xs text-muted-foreground">{a.department.name}</div></TableCell>
                    <TableCell>{new Date(a.slotStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</TableCell>
                    <TableCell><Badge variant={statusVariant(a.status)}>{a.status.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.source}</TableCell>
                    <TableCell className="text-right">
                      {["BOOKED","WAITING","NOTIFIED","DELAYED"].includes(a.status) && (
                        <Button variant="ghost" size="sm" disabled={cancelMut.isPending} onClick={() => cancelMut.mutate(a.id)}><X className="size-4" />Cancel</Button>
                      )}
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
