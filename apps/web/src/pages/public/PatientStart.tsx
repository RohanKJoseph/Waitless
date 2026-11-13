import { ArrowRight, CalendarPlus, Phone, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PatientStartPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    // Phase 3 replaces this with POST /patients/session.
    toast.info("Patient sessions arrive in the next phase", {
      description: "For now, browse the portal with sample data.",
    });
    navigate("/patient");
  }

  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-20">
      <div className="max-w-lg space-y-5">
        <p className="text-sm font-medium text-primary">Start here</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Your name and number. That's all.
        </h1>
        <p className="text-muted-foreground">
          No passwords, no forms full of questions. We use your mobile number to find your
          appointments and send queue updates.
        </p>
        <ul className="space-y-3 text-sm">
          {[
            "Book for today or the next 7 days",
            "Track the live queue from anywhere",
            "Swap slots only if both patients agree",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Mobile verification (OTP) is planned for a later release — for now the number is
          treated as unverified.
        </p>
      </div>

      <Card className="w-full max-w-md justify-self-center lg:justify-self-end">
        <CardHeader>
          <CardTitle>Sign in to book</CardTitle>
          <CardDescription>Use the same number every time to keep your visit history.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="fullName"
                  className="pl-9"
                  placeholder="Rohan Kumar"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile number</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  +91
                </span>
                <Input
                  id="phone"
                  className="pl-12"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  pattern="[0-9 ]{10,14}"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We'll never share this number with other patients.
              </p>
            </div>

            <Button type="submit" size="lg" className="w-full">
              <CalendarPlus className="size-4" />
              Continue to booking
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="size-3.5" />
              No OTP needed today
            </span>
            <Link to="/login" className="font-medium text-primary hover:underline">
              Staff login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
