import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Power, Stethoscope } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import {
  createDoctor,
  deleteDoctor,
  listDepartments,
  listDoctors,
  updateDoctor,
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

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit({ departmentId, fullName, designation, avgConsultMinutes: Number(avgConsultMinutes) || 12 });
      }}
    >
      <div className="space-y-1.5">
        <Label>Department</Label>
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Dr. Anita Rao" />
        </div>
        <div className="space-y-1.5">
          <Label>Designation</Label>
          <Input value={designation} onChange={(e) => setDesignation(e.target.value)} required placeholder="Consultant" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Avg consult (minutes)</Label>
        <Input type="number" min={3} max={120} value={avgConsultMinutes} onChange={(e) => setAvgConsultMinutes(e.target.value)} required />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting || !departmentId}>{submitting ? "Saving…" : "Save"}</Button>
      </DialogFooter>
    </form>
  );
}

export function DoctorsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
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
    </div>
  );
}
