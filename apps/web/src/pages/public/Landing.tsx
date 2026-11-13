import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  ListOrdered,
  QrCode,
  Repeat2,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  Timer,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero ----------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b">
        <div className="surface-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="container-page relative grid gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div className="space-y-7">
            <Badge variant="outline" className="bg-background/70 backdrop-blur">
              <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
              Live queue tracking · built for busy OPDs
            </Badge>

            <div className="space-y-5">
              <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Skip the waiting room.
                <span className="block text-primary">Keep the care.</span>
              </h1>
              <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Waitless books your appointment, tracks your place in the queue and nudges you
                30 minutes before your turn — so you can wait somewhere better than a plastic
                chair.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/start">
                  Book an appointment
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">
                  <ShieldCheck className="size-4" />
                  Hospital staff login
                </Link>
              </Button>
            </div>

            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["No app install", "QR check-in", "Free for patients"].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <TokenPreview />
        </div>
      </section>

      {/* Metrics -------------------------------------------------------------- */}
      <section className="border-b bg-card/50">
        <div className="container-page grid grid-cols-2 gap-6 py-8 sm:grid-cols-4">
          {[
            { value: "30 min", label: "Advance turn alert" },
            { value: "Live", label: "Doctor-wise queue" },
            { value: "2-sided", label: "Consent for slot swaps" },
            { value: "1 scan", label: "To join the queue" },
          ].map((metric) => (
            <div key={metric.label} className="space-y-1">
              <p className="text-2xl font-semibold tracking-tight">{metric.value}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works --------------------------------------------------------- */}
      <section id="how-it-works" className="container-page scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Three steps, one calm visit
          </h2>
          <p className="mt-3 text-muted-foreground">
            The hospital keeps running the clinic. Waitless handles the waiting.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: ScanLine,
              title: "Scan or book remotely",
              body: "Scan the QR at the hospital entrance, or book from home. Pick a department, a doctor and a slot that suits you.",
            },
            {
              icon: ListOrdered,
              title: "Track your live queue",
              body: "See your token, how many patients are ahead and a realistic estimate that updates as the clinic moves.",
            },
            {
              icon: BellRing,
              title: "Arrive right on time",
              body: "Get a nudge 30 minutes before your turn and another when you're next. No more camping in the corridor.",
            },
          ].map((step, index) => (
            <li key={step.title}>
              <Card className="h-full gap-4">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <step.icon className="size-5" />
                  </span>
                  <span className="text-3xl font-semibold tabular-nums text-muted-foreground/25">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Features ------------------------------------------------------------- */}
      <section className="border-y bg-card/40 py-16 sm:py-20">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="space-y-4">
              <p className="text-sm font-medium text-primary">Built for the real clinic</p>
              <h2 className="text-3xl font-semibold tracking-tight">
                Small details that remove big frustrations
              </h2>
              <p className="text-muted-foreground">
                Delays happen. Patients get stuck in traffic. Waitless handles the messy middle
                instead of pretending every visit runs on time.
              </p>
              <Button variant="outline" asChild>
                <Link to="/patient">
                  Explore the patient portal
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Clock3,
                  title: "Honest wait estimates",
                  body: "Estimates use the doctor's real consultation pace, not a fixed guess, and refresh on every queue change.",
                },
                {
                  icon: Repeat2,
                  title: "Swap slots safely",
                  body: "Both patients must agree. The exchange happens in one transaction, so nobody ends up with a duplicate token.",
                },
                {
                  icon: BellRing,
                  title: "Nudges, not noise",
                  body: "A 30-minute heads-up, a next-in-line alert and a delay warning. Every message is tied to a real queue event.",
                },
                {
                  icon: Stethoscope,
                  title: "Delays handled with grace",
                  body: "A configurable grace period, staff override and automatic requeue keep the queue fair when someone is late.",
                },
              ].map((feature) => (
                <Card key={feature.title} className="gap-3 p-5">
                  <feature.icon className="size-5 text-primary" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA ------------------------------------------------------------------ */}
      <section className="container-page py-16 sm:py-20">
        <Card className="relative overflow-hidden border-primary/20 bg-primary/5 p-8 sm:p-12">
          <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Ready when you are.
              </h2>
              <p className="max-w-xl text-muted-foreground">
                Book a slot at the demo hospital, or sign in as staff to run the queue.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/start">
                  <QrCode className="size-4" />
                  Start booking
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/admin">
                  <Timer className="size-4" />
                  Open admin
                </Link>
              </Button>
            </div>
          </div>
          <CalendarCheck2
            className="pointer-events-none absolute -bottom-8 -right-6 size-40 text-primary/10"
            aria-hidden="true"
          />
        </Card>
      </section>
    </div>
  );
}

function TokenPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-info/10 blur-xl" />
      <Card className="relative gap-0 overflow-hidden p-0 shadow-lg">
        <div className="flex items-center justify-between border-b bg-primary px-5 py-4 text-primary-foreground">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Your token</p>
            <p className="text-3xl font-semibold tabular-nums">#24</p>
          </div>
          <Badge className="bg-primary-foreground/15 text-primary-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" />
            In queue
          </Badge>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Dr. Anita Rao</p>
              <p className="text-xs text-muted-foreground">General Medicine · OPD-1</p>
            </div>
            <span className="rounded-lg bg-muted px-2 py-1 text-xs font-medium">10:15 AM</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">2 patients ahead</span>
              <span className="font-medium">~18 min</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-2/3 rounded-full bg-primary" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>In consultation</span>
              <span>You</span>
            </div>
          </div>

          <div className="rounded-xl border border-dashed bg-muted/40 p-3">
            <p className="flex items-center gap-2 text-xs font-medium">
              <BellRing className="size-3.5 text-primary" />
              We'll alert you 30 minutes before your turn
            </p>
            <p className="mt-1 pl-5.5 text-xs text-muted-foreground">
              Estimated start 10:15 AM · updates live
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t bg-card px-5 py-3 text-xs text-muted-foreground">
          <span>City Care Hospital</span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-success" />
            Synced just now
          </span>
        </div>
      </Card>
    </div>
  );
}
