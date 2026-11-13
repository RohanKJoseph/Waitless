import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { CardEmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Patient = { id: string; fullName: string; phone: string; email: string | null; phoneVerified: boolean; createdAt: string; _count?: { appointments: number } };

export function PatientsPage() {
  const [q, setQ] = useState("");
  const patientsQ = useQuery({
    queryKey: ["patients", "admin", q],
    queryFn: async () => (await api.get<{ data: { patients: Patient[] } }>(`/patients?q=${encodeURIComponent(q)}&pageSize=100`)).data.patients,
  });
  const items = patientsQ.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Patients" description="Look up patients, contact details and visit counts." />
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email" className="pl-9" />
      </div>
      <Card>
        <CardContent className="p-0">
          {patientsQ.isLoading ? <div className="p-6 text-sm text-muted-foreground">Loading patients…</div> : items.length === 0 ? (
            <div className="p-6"><CardEmptyState icon={Users} title="No patients found" description="Patients appear here after they start a session or are registered for a visit." /></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead>Visits</TableHead><TableHead>Verified</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.fullName}</TableCell>
                    <TableCell>{p.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{p.email ?? "—"}</TableCell>
                    <TableCell>{p._count?.appointments ?? 0}</TableCell>
                    <TableCell>{p.phoneVerified ? "Yes" : "No"}</TableCell>
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
