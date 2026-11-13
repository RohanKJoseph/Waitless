import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, QrCode } from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ScanPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const verifyQ = useQuery({
    queryKey: ["qr", "verify", token],
    queryFn: async () => (await api.post<{ data: { valid: boolean } }>("/qr/verify", { token })).data,
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (verifyQ.data?.valid) {
      navigate("/patient/book", { replace: true });
    }
  }, [verifyQ.data, navigate]);

  if (verifyQ.isLoading) {
    return <div className="mx-auto max-w-lg p-6"><Card><CardContent className="p-6 text-sm text-muted-foreground">Verifying QR code…</CardContent></Card></div>;
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><QrCode className="size-5" />QR check-in</CardTitle>
          <CardDescription>This QR code could not be used.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 text-destructive" />
            <div>
              <p className="font-medium">Invalid or expired QR code</p>
              <p className="text-muted-foreground">The link may be tampered with or expired. You can still book remotely.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link to="/start">Book remotely</Link></Button>
            <Button asChild variant="outline"><Link to="/">Back to home</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
