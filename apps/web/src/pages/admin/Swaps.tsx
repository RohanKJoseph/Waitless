import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Repeat2, X } from "lucide-react";
import { toast } from "sonner";
import { ApiError, api } from "@/lib/api";
import { CardEmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Swap = {
  id: string;
  status: string;
  expiresAt: string;
  requesterPatient: { fullName: string; phone?: string };
  targetPatient: { fullName: string; phone?: string };
  requesterAppointment: { tokenNumber: number; slotStart: string; doctor: { fullName: string } };
  targetAppointment: { tokenNumber: number; slotStart: string };
};

export function AdminSwapsPage() {
  const qc = useQueryClient();
  const swapsQ = useQuery({ queryKey: ["swaps", "admin"], queryFn: async () => (await api.get<{ data: { swaps: Swap[] } }>("/swaps?role=all")).data.swaps });
  const cancelMut = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/swaps/${id}/cancel`, {})),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["swaps"] }); toast.success("Swap cancelled"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not cancel swap"),
  });
  const swaps = swapsQ.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Swap oversight" description="Monitor and cancel swap requests across the hospital." />
      <Card>
        <CardContent className="p-0">
          {swapsQ.isLoading ? <div className="p-6 text-sm text-muted-foreground">Loading swaps…</div> : swaps.length === 0 ? (
            <div className="p-6"><CardEmptyState icon={Repeat2} title="No swap requests" description="Swap requests will appear here with their status and participants." /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Doctor</TableHead><TableHead>Requester</TableHead><TableHead>Target</TableHead><TableHead>Status</TableHead><TableHead>Expires</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {swaps.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.requesterAppointment.doctor.fullName}</TableCell>
                    <TableCell><div>{s.requesterPatient.fullName}</div><div className="text-xs text-muted-foreground">#{s.requesterAppointment.tokenNumber} · {new Date(s.requesterAppointment.slotStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div></TableCell>
                    <TableCell><div>{s.targetPatient.fullName}</div><div className="text-xs text-muted-foreground">#{s.targetAppointment.tokenNumber} · {new Date(s.targetAppointment.slotStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div></TableCell>
                    <TableCell><Badge variant={s.status === "PENDING" ? "warning" : s.status === "ACCEPTED" ? "success" : "muted"}>{s.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(s.expiresAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{s.status === "PENDING" && <Button size="sm" variant="ghost" disabled={cancelMut.isPending} onClick={() => cancelMut.mutate(s.id)}><X className="size-4" />Cancel</Button>}</TableCell>
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
