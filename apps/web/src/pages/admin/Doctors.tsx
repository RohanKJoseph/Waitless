import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Pencil, Plus, Power, Stethoscope, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { doctorFormSchema } from "@waitless/shared";
import { ApiError } from "@/lib/api";
import {
  createDoctor,
  createSchedule,
  deleteDoctor,
  deleteException,
  deleteSchedule,
  getAvailability,
  listDepartments,
  listDoctors,
  listExceptions,
  listSchedules,
  updateDoctor,
  upsertException,
  type Department,
  type Doctor,
} from "@/lib/admin-api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function minutesToHHmm(m: number) {
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}
function hhmmToMinutes(v: string) {
  const [h, m] = v.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function ScheduleManager({ doctor }: { doctor: Doctor }) {
  const qc = useQueryClient();
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("13:00");
  const [slotMinutes, setSlotMinutes] = useState("15");
  const [exDate, setExDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [exClosed, setExClosed] = useState(true);
  const [exNote, setExNote] = useState("");
  const [previewDate, setPreviewDate] = useState(() => new Date().toISOString().slice(0, 10));

  const schedulesQ = useQuery({ queryKey: ["doctor-schedules", doctor.id], queryFn: () => listSchedules(doctor.id) });
  const exceptionsQ = useQuery({ queryKey: ["doctor-exceptions", doctor.id], queryFn: () => listExceptions(doctor.id) });
  const availabilityQ = useQuery({ queryKey: ["doctor-availability", doctor.id, previewDate], queryFn: () => getAvailability(doctor.id, previewDate) });

  const createScheduleMut = useMutation({
    mutationFn: () => createSchedule(doctor.id, { dayOfWeek: Number(dayOfWeek), startMinute: hhmmToMinutes(start), endMinute: hhmmToMinutes(end), slotMinutes: Number(slotMinutes) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["doctor-schedules", doctor.id] }); void qc.invalidateQueries({ queryKey: ["doctor-availability", doctor.id] }); toast.success("Schedule window added"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to add schedule"),
  });
  const deleteScheduleMut = useMutation({
    mutationFn: (id: string) => deleteSchedule(doctor.id, id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["doctor-schedules", doctor.id] }); void qc.invalidateQueries({ queryKey: ["doctor-availability", doctor.id] }); toast.success("Schedule removed"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to remove schedule"),
  });
  const upsertExMut = useMutation({
    mutationFn: () => upsertException(doctor.id, { date: exDate, isClosed: exClosed, note: exNote || null }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["doctor-exceptions", doctor.id] }); void qc.invalidateQueries({ queryKey: ["doctor-availability", doctor.id] }); toast.success("Exception saved"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to save exception"),
  });
  const deleteExMut = useMutation({
    mutationFn: (id: string) => deleteException(doctor.id, id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["doctor-exceptions", doctor.id] }); void qc.invalidateQueries({ queryKey: ["doctor-availability", doctor.id] }); toast.success("Exception removed"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to remove exception"),
  });

  return (
    <Tabs defaultValue="weekly" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="weekly">Weekly</TabsTrigger>
        <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
        <TabsTrigger value="preview">Availability</TabsTrigger>
      </TabsList>

      <TabsContent value="weekly" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1.5"><Label>Day</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
            </SelectContent></Select>
          </div>
          <div className="space-y-1.5"><Label>Start</Label><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>End</Label><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Slot (min)</Label><Input type="number" min={5} max={120} value={slotMinutes} onChange={(e) => setSlotMinutes(e.target.value)} /></div>
        </div>
        <Button size="sm" onClick={() => createScheduleMut.mutate()} disabled={createScheduleMut.isPending}><Plus className="size-4" />Add window</Button>
        <div className="space-y-2">
          {(schedulesQ.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No weekly windows yet.</p> : (schedulesQ.data ?? []).map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div>
                <span className="font-medium">{DAYS[s.dayOfWeek]}</span> {minutesToHHmm(s.startMinute)}–{minutesToHHmm(s.endMinute)} <span className="text-muted-foreground">· {s.slotMinutes} min slots</span>
                {!s.isActive && <Badge variant="muted" className="ml-2">Inactive</Badge>}
              </div>
              <Button size="icon-sm" variant="ghost" onClick={() => deleteScheduleMut.mutate(s.id)}><Trash2 className="size-4" /></Button>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="exceptions" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={exDate} onChange={(e) => setExDate(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Type</Label>
            <Select value={exClosed ? "closed" : "open"} onValueChange={(v) => setExClosed(v === "closed")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="closed">Closed (holiday/off)</SelectItem>
              <SelectItem value="open">Custom hours (basic)</SelectItem>
            </SelectContent></Select>
          </div>
          <div className="space-y-1.5"><Label>Note</Label><Input value={exNote} onChange={(e) => setExNote(e.target.value)} placeholder="Holiday / leave" /></div>
        </div>
        <Button size="sm" onClick={() => upsertExMut.mutate()} disabled={upsertExMut.isPending}><Plus className="size-4" />Save exception</Button>
        <div className="space-y-2">
          {(exceptionsQ.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No exceptions.</p> : (exceptionsQ.data ?? []).map((ex) => (
            <div key={ex.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div><span className="font-medium">{String(ex.date).slice(0, 10)}</span> · {ex.isClosed ? "Closed" : "Custom hours"} {ex.note ? <span className="text-muted-foreground">— {ex.note}</span> : null}</div>
              <Button size="icon-sm" variant="ghost" onClick={() => deleteExMut.mutate(ex.id)}><Trash2 className="size-4" /></Button>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="preview" className="space-y-4">
        <div className="flex items-end gap-3">
          <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={previewDate} onChange={(e) => setPreviewDate(e.target.value)} /></div>
          {availabilityQ.data && <Badge variant={availabilityQ.data.isOnDuty ? "success" : "muted"}>{availabilityQ.data.isOnDuty ? "On duty" : "Off / no slots"}</Badge>}
        </div>
        {availabilityQ.isLoading ? <p className="text-sm text-muted-foreground">Loading availability…</p> : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {(availabilityQ.data?.slots ?? []).length === 0 ? <p className="col-span-full text-sm text-muted-foreground">No slots for this date.</p> : (availabilityQ.data?.slots ?? []).map((slot) => (
              <div key={slot.start} className={`rounded-md border px-2 py-1.5 text-xs ${slot.isBooked ? "bg-muted text-muted-foreground" : slot.isPast ? "opacity-60" : "bg-success/10 text-success-foreground"}`}>
                <div className="font-medium">{slot.label}</div>
                <div>{slot.isBooked ? "Booked" : slot.isPast ? "Past" : "Open"}</div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function DoctorForm({
  initial,
  departments,
  onSubmit,
  submitting,
}: {
  initial?: Partial<Doctor>;
  departments: Department[];
  onSubmit: (values: { departmentId: string; fullName: string; designation: string; avgConsultMinutes: number }) => Promise<void>;
  submitting: boolean;
}) {
  const [departmentId, setDepartmentId] = useState(initial?.departmentId ?? departments[0]?.id ?? "");
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [designation, setDesignation] = useState(initial?.designation ?? "");
  const [avgConsultMinutes, setAvgConsultMinutes] = useState(String(initial?.avgConsultMinutes ?? 12));
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = doctorFormSchema.safeParse({ departmentId, fullName, designation, avgConsultMinutes });
        if (!parsed.success) {
          const next: Record<string, string> = {};
          for (const issue of parsed.error.issues) {
            const key = String(issue.path[0] ?? "form");
            if (!next[key]) next[key] = issue.message;
          }
          setErrors(next);
          toast.error("Please fix the highlighted fields");
          return;
        }
        setErrors({});
        void onSubmit(parsed.data);
      }}
    >
      <div className="space-y-1.5">
        <Label>Department</Label>
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger aria-invalid={!!errors.departmentId}><SelectValue placeholder="Select department" /></SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Anita Rao" aria-invalid={!!errors.fullName} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Designation</Label>
          <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Consultant" aria-invalid={!!errors.designation} />
          {errors.designation && <p className="text-xs text-destructive">{errors.designation}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Avg consult (minutes)</Label>
        <Input type="number" min={3} max={120} value={avgConsultMinutes} onChange={(e) => setAvgConsultMinutes(e.target.value)} aria-invalid={!!errors.avgConsultMinutes} />
        {errors.avgConsultMinutes && <p className="text-xs text-destructive">{errors.avgConsultMinutes}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
      </DialogFooter>
    </form>
  );
}

export function DoctorsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [scheduleDoctor, setScheduleDoctor] = useState<Doctor | null>(null);
  const [query, setQuery] = useState("");

  const { data: deptData = [] } = useQuery({ queryKey: ["departments", "admin"], queryFn: () => listDepartments(true) });
  const { data, isLoading } = useQuery({ queryKey: ["doctors", "admin"], queryFn: () => listDoctors({ includeInactive: true }) });
  const doctors = data?.doctors ?? [];

  const createMut = useMutation({
    mutationFn: createDoctor,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["doctors"] });
      toast.success("Doctor added");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to add doctor"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateDoctor>[1] }) => updateDoctor(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["doctors"] });
      toast.success("Doctor updated");
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update doctor"),
  });

  const toggleMut = useMutation({
    mutationFn: (doc: Doctor) => (doc.isActive ? deleteDoctor(doc.id) : updateDoctor(doc.id, { isActive: true })),
    onSuccess: (_d, doc) => {
      void qc.invalidateQueries({ queryKey: ["doctors"] });
      toast.success(doc.isActive ? "Doctor deactivated" : "Doctor activated");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Action failed"),
  });

  const deptById = useMemo(() => new Map(deptData.map((d) => [d.id, d])), [deptData]);
  const filtered = doctors.filter((d) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return d.fullName.toLowerCase().includes(q) || d.designation.toLowerCase().includes(q) || (d.department?.name ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctors"
        description="Manage consultant profiles, weekly clinics, appointment capacity and room assignment."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" />Add doctor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add doctor</DialogTitle>
                <DialogDescription>Create a doctor profile and assign a department.</DialogDescription>
              </DialogHeader>
              <DoctorForm
                departments={deptData.filter((d) => d.isActive)}
                submitting={createMut.isPending}
                onSubmit={async (values) => { await createMut.mutateAsync(values); }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input className="max-w-sm" placeholder="Search doctors…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Badge variant="neutral">{doctors.length} total</Badge>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading doctors…</CardContent></Card>
      ) : filtered.length === 0 ? (
        <CardEmptyState icon={Stethoscope} title="No doctors found" description="Add a doctor or adjust your search." />
      ) : (
        <Card className="p-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Avg consult</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="font-medium">{doc.fullName}</div>
                      <div className="text-xs text-muted-foreground">{doc.designation}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{doc.department?.name ?? deptById.get(doc.departmentId)?.name ?? "—"}</Badge></TableCell>
                    <TableCell>{doc.avgConsultMinutes} min</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{doc.room?.code ?? "—"}</TableCell>
                    <TableCell><Badge variant={doc.isActive ? "success" : "muted"}>{doc.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setScheduleDoctor(doc)}><CalendarClock className="size-3.5" />Schedule</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(doc)}><Pencil className="size-3.5" />Edit</Button>
                        <Button size="sm" variant={doc.isActive ? "ghost" : "secondary"} disabled={toggleMut.isPending} onClick={() => toggleMut.mutate(doc)}>
                          <Power className="size-3.5" />{doc.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit doctor</DialogTitle>
            <DialogDescription>Update doctor profile and department assignment.</DialogDescription>
          </DialogHeader>
          {editing && (
            <DoctorForm
              initial={editing}
              departments={deptData}
              submitting={updateMut.isPending}
              onSubmit={async (values) => { await updateMut.mutateAsync({ id: editing.id, input: values }); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!scheduleDoctor} onOpenChange={(o) => !o && setScheduleDoctor(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Schedule — {scheduleDoctor?.fullName}</DialogTitle>
            <DialogDescription>Manage weekly clinic windows, exceptions, and preview availability.</DialogDescription>
          </DialogHeader>
          {scheduleDoctor && <ScheduleManager doctor={scheduleDoctor} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
