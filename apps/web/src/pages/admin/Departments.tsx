import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Power } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { departmentFormSchema } from "@waitless/shared";
import { ApiError } from "@/lib/api";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
  type Department,
} from "@/lib/admin-api";
import { CardEmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function DepartmentForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: Partial<Department>;
  onSubmit: (values: { name: string; code: string; description?: string; location?: string }) => Promise<void>;
  submitting: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = departmentFormSchema.safeParse({ name, code, description, location });
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="dept-name">Name</Label>
          <Input id="dept-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dept-code">Code</Label>
          <Input id="dept-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="GM" aria-invalid={!!errors.code} />
          {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dept-location">Location</Label>
        <Input id="dept-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ground floor, Block A" />
        {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dept-desc">Description</Label>
        <Input id="dept-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
      </DialogFooter>
    </form>
  );
}

export function DepartmentsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [query, setQuery] = useState("");

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments", "admin"],
    queryFn: () => listDepartments(true),
  });

  const createMut = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create department"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateDepartment>[1] }) => updateDepartment(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated");
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update department"),
  });

  const toggleMut = useMutation({
    mutationFn: (dept: Department) =>
      dept.isActive ? deleteDepartment(dept.id) : updateDepartment(dept.id, { isActive: true }),
    onSuccess: (_data, dept) => {
      void qc.invalidateQueries({ queryKey: ["departments"] });
      toast.success(dept.isActive ? "Department deactivated" : "Department activated");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Action failed"),
  });

  const filtered = departments.filter((d) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || (d.location ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Clinical units patients choose from when booking. Deactivating a department hides it from new bookings."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" />Add department</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add department</DialogTitle>
                <DialogDescription>Create a new clinical department.</DialogDescription>
              </DialogHeader>
              <DepartmentForm
                submitting={createMut.isPending}
                onSubmit={async (values) => {
                  await createMut.mutateAsync(values);
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex items-center gap-3">
        <Input className="max-w-sm" placeholder="Search departments…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Badge variant="neutral">{departments.length} total</Badge>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading departments…</CardContent></Card>
      ) : filtered.length === 0 ? (
        <CardEmptyState icon={Building2} title="No departments found" description="Create a department or adjust your search." />
      ) : (
        <Card className="p-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Doctors</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>
                      <div className="font-medium">{dept.name}</div>
                      {dept.description && <div className="text-xs text-muted-foreground">{dept.description}</div>}
                    </TableCell>
                    <TableCell><Badge variant="outline">{dept.code}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{dept.location ?? "—"}</TableCell>
                    <TableCell>{dept._count?.doctors ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={dept.isActive ? "success" : "muted"}>{dept.isActive ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing(dept)}><Pencil className="size-3.5" />Edit</Button>
                        <Button size="sm" variant={dept.isActive ? "ghost" : "secondary"} disabled={toggleMut.isPending} onClick={() => toggleMut.mutate(dept)}>
                          <Power className="size-3.5" />{dept.isActive ? "Deactivate" : "Activate"}
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
            <DialogTitle>Edit department</DialogTitle>
            <DialogDescription>Update department details.</DialogDescription>
          </DialogHeader>
          {editing && (
            <DepartmentForm
              initial={editing}
              submitting={updateMut.isPending}
              onSubmit={async (values) => {
                await updateMut.mutateAsync({
                  id: editing.id,
                  input: { name: values.name, code: values.code, description: values.description || null, location: values.location || null },
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
