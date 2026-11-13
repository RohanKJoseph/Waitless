import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Check, ChevronRight, Clock3, Stethoscope, Ticket, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ApiError, api } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Department = { id: string; name: string; code: string; description: string | null; location: string | null; isActive: boolean; _count?: { doctors: number } };
type Doctor = { id: string; fullName: string; designation: string; avgConsultMinutes: number; departmentId: string; isActive: boolean; room?: { code: string } | null; isOnDuty?: boolean; queueLength?: number; nextAvailableSlot?: { start: string; label: string } | null };
type Slot = { start: string; end: string; label: string; rangeLabel: string; isBooked: boolean; isPast: boolean };
type Appointment = { id: string; tokenNumber: number; serviceDay: string; slotStart: string; slotEnd: string; status: string; doctor: { fullName: string; room?: { code: string } | null; department?: { name: string } | null }; department: { name: string } };

const STEPS = ["Department", "Doctor", "Time slot", "Confirm", "Booked"] as const;

export function BookAppointmentPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [date, setDate] = useState(today);
  const [slotStart, setSlotStart] = useState<string | null>(null);
  const [booked, setBooked] = useState<Appointment | null>(null);

  const deptsQ = useQuery({
    queryKey: ["departments", "public"],
    queryFn: async () => (await api.get<{ data: { departments: Department[] } }>("/departments?active=true")).data.departments,
  });
  const doctorsQ = useQuery({
    queryKey: ["doctors", "public", departmentId, date],
    queryFn: async () => (await api.get<{ data: { doctors: Doctor[] } }>(`/doctors?departmentId=${departmentId}&date=${date}&active=true&pageSize=50`)).data.doctors,
    enabled: !!departmentId,
  });
  const availabilityQ = useQuery({
    queryKey: ["availability", doctorId, date],
    queryFn: async () => (await api.get<{ data: { isOnDuty: boolean; slots: Slot[] } }>(`/doctors/${doctorId}/availability?date=${date}`)).data,
    enabled: !!doctorId && step >= 2,
  });

  const bookMut = useMutation({
    mutationFn: async () => {
      if (!doctorId || !slotStart) throw new Error("Missing selection");
      return (await api.post<{ data: { appointment: Appointment } }>("/appointments", { doctorId, slotStart, source: "REMOTE" })).data.appointment;
    },
    onSuccess: async (appointment) => {
      setBooked(appointment);
      setStep(4);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["appointments"] }),
        qc.invalidateQueries({ queryKey: ["availability", doctorId, date] }),
        qc.invalidateQueries({ queryKey: ["doctors", "public"] }),
      ]);
      toast.success("Appointment booked");
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Could not book appointment";
      toast.error(msg);
      if (doctorId) void qc.invalidateQueries({ queryKey: ["availability", doctorId, date] });
    },
  });

  const selectedDept = (deptsQ.data ?? []).find((d) => d.id === departmentId);
  const selectedDoctor = (doctorsQ.data ?? []).find((d) => d.id === doctorId);
  const selectedSlot = (availabilityQ.data?.slots ?? []).find((s) => s.start === slotStart);

  function canContinue() {
    if (step === 0) return !!departmentId;
    if (step === 1) return !!doctorId;
    if (step === 2) return !!slotStart;
    if (step === 3) return !!slotStart && !!doctorId;
    return false;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Book an appointment"
        description="Choose a department, pick your doctor and reserve a slot."
      />

      <ol className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((s, index) => (
          <li key={s} className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => index < step && step < 4 && setStep(index)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                index === step ? "border-primary/30 bg-accent text-accent-foreground" : index < step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span className={cn("grid size-5 place-items-center rounded-full text-[10px]", index <= step ? "bg-primary text-primary-foreground" : "bg-muted")}>{index + 1}</span>
              {s}
            </button>
            {index < STEPS.length - 1 && <ChevronRight className="size-3.5 text-muted-foreground" />}
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Step {step + 1} · {STEPS[step]}</CardTitle>
              <CardDescription>
                {step === 0 && "Select the clinical department for your visit."}
                {step === 1 && "Choose a doctor. Queue and next-slot info is shown for the selected date."}
                {step === 2 && "Pick an available time slot."}
                {step === 3 && "Review details and confirm your booking."}
                {step === 4 && "Your appointment is booked. Keep your token handy."}
              </CardDescription>
            </div>
            {step < 3 ? <Badge variant="info">Live data</Badge> : step === 3 ? <Badge variant="warning">Confirm</Badge> : <Badge variant="success">Booked</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {deptsQ.isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              {!deptsQ.isLoading && (deptsQ.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No active departments available right now.</p>}
              {(deptsQ.data ?? []).map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => { setDepartmentId(dept.id); setDoctorId(null); setSlotStart(null); }}
                  className={cn("flex items-start gap-3 rounded-xl border p-4 text-left transition-colors", departmentId === dept.id ? "border-primary bg-accent/40" : "hover:bg-muted/30")}
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground"><Stethoscope className="size-4.5" /></span>
                  <div>
                    <p className="text-sm font-medium">{dept.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{dept._count?.doctors ?? 0} doctors · {dept.location ?? "Hospital"}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">Date (for availability)</p><Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSlotStart(null); }} className="w-auto" /></div>
                {selectedDept && <Badge variant="outline">{selectedDept.name}</Badge>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {doctorsQ.isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
                {(doctorsQ.data ?? []).map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => { setDoctorId(doc.id); setSlotStart(null); }}
                    className={cn("rounded-xl border p-4 text-left transition-colors", doctorId === doc.id ? "border-primary bg-accent/40" : "hover:bg-muted/30")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{doc.fullName}</p>
                        <p className="text-xs text-muted-foreground">{doc.designation}{doc.room?.code ? ` · ${doc.room.code}` : ""}</p>
                      </div>
                      <Badge variant={doc.isOnDuty ? "success" : "muted"}>{doc.isOnDuty ? "On duty" : "Off"}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />~{doc.avgConsultMinutes} min</span>
                      <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{doc.queueLength ?? 0} in queue</span>
                      <span className="inline-flex items-center gap-1"><CalendarPlus className="size-3.5" />Next: {doc.nextAvailableSlot?.label ?? "—"}</span>
                    </div>
                  </button>
                ))}
                {!doctorsQ.isLoading && (doctorsQ.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No doctors available for this department.</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground">Date</p><Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSlotStart(null); }} className="w-auto" /></div>
                {selectedDoctor && <Badge variant="outline">{selectedDoctor.fullName}</Badge>}
                {availabilityQ.data && <Badge variant={availabilityQ.data.isOnDuty ? "success" : "muted"}>{availabilityQ.data.isOnDuty ? "On duty" : "No clinic"}</Badge>}
              </div>
              {availabilityQ.isLoading ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {(availabilityQ.data?.slots ?? []).map((slot) => {
                    const disabled = slot.isBooked || slot.isPast;
                    const selected = slot.start === slotStart;
                    return (
                      <button
                        key={slot.start}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSlotStart(slot.start)}
                        className={cn(
                          "rounded-lg border px-2 py-2 text-sm transition-colors",
                          disabled ? "cursor-not-allowed bg-muted/40 text-muted-foreground opacity-60" : "hover:border-primary/40 hover:bg-accent/40",
                          selected && "border-primary bg-accent text-accent-foreground",
                        )}
                      >
                        <div className="font-medium">{slot.label}</div>
                        <div className="text-[10px]">{slot.isBooked ? "Booked" : slot.isPast ? "Past" : "Open"}</div>
                      </button>
                    );
                  })}
                </div>
              )}
              {!availabilityQ.isLoading && (availabilityQ.data?.slots ?? []).length === 0 && <p className="text-sm text-muted-foreground">No slots available for this date.</p>}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/20 p-5 space-y-3">
                <h3 className="font-medium">Appointment summary</h3>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div><span className="text-muted-foreground">Department:</span> <span className="font-medium">{selectedDept?.name ?? "—"}</span></div>
                  <div><span className="text-muted-foreground">Doctor:</span> <span className="font-medium">{selectedDoctor?.fullName ?? "—"}</span></div>
                  <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{date}</span></div>
                  <div><span className="text-muted-foreground">Slot:</span> <span className="font-medium">{selectedSlot?.rangeLabel ?? selectedSlot?.label ?? "—"}</span></div>
                </div>
              </div>
              <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground flex items-center gap-2"><Check className="size-4 text-success" /> Ready to book</p>
                <p className="mt-1">Confirm to reserve this slot and receive your token number.</p>
              </div>
            </div>
          )}

          {step === 4 && booked && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-emerald-50/50 p-6 text-center dark:bg-emerald-950/20">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><Ticket className="size-6" /></div>
                <p className="text-sm text-muted-foreground">Your token</p>
                <p className="text-4xl font-semibold tracking-tight">#{booked.tokenNumber}</p>
                <p className="mt-2 text-sm font-medium">{booked.doctor.fullName}</p>
                <p className="text-xs text-muted-foreground">{booked.department?.name ?? booked.doctor.department?.name} · {booked.serviceDay} · {new Date(booked.slotStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{booked.doctor.room?.code ? ` · Room ${booked.doctor.room.code}` : ""}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline"><Link to="/patient/appointments">View my visits</Link></Button>
                <Button asChild><Link to="/patient/queue">Track queue</Link></Button>
              </div>
            </div>
          )}

          {step < 4 && (
            <div className="flex items-center justify-between">
              <Button variant="outline" disabled={step === 0 || bookMut.isPending} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
              {step < 3 ? (
                <Button disabled={!canContinue()} onClick={() => setStep((s) => s + 1)}>
                  Continue <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button disabled={!canContinue() || bookMut.isPending} onClick={() => bookMut.mutate()}>
                  <CalendarPlus className="size-4" />{bookMut.isPending ? "Booking…" : "Confirm booking"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
