import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";

export function LoginPage() {
  const { login, status, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@waitless.local");
  const [password, setPassword] = useState("Admin@12345");
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated" && user && user.role !== "PATIENT") {
    return <Navigate to="/admin" replace />;
  }
  if (status === "authenticated" && user?.role === "PATIENT") {
    return <Navigate to="/patient" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const signedIn = await login(email, password);
      toast.success(`Welcome, ${signedIn.name}`);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from && from.startsWith("/admin") ? from : "/admin", { replace: true });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to sign in";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page grid min-h-[calc(100dvh-4rem)] place-items-center py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Brand />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Staff sign in</h1>
            <p className="text-sm text-muted-foreground">
              For administrators and front-desk staff.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hospital account</CardTitle>
            <CardDescription>
              Use the credentials seeded in your local database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@hospital.org"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <span className="text-xs text-muted-foreground">Demo only</span>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                <LockKeyhole className="size-4" />
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="mt-5 rounded-lg border border-dashed bg-muted/40 p-3 text-xs leading-relaxed">
              <p className="font-medium text-foreground">Seeded accounts</p>
              <p className="mt-1 text-muted-foreground">
                Admin · admin@waitless.local / Admin@12345
              </p>
              <p className="text-muted-foreground">
                Front desk · frontdesk@waitless.local / Admin@12345
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-sm">
          <Link to="/" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
          <Link to="/start" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
            <ShieldCheck className="size-3.5" />
            Book as a patient
          </Link>
        </div>
      </div>
    </div>
  );
}
