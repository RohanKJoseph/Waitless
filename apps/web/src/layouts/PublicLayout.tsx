import { Link, Outlet, useLocation } from "react-router-dom";
import { ApiStatus } from "@/components/shared/api-status";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/", label: "Home", match: (path: string) => path === "/" },
  { to: "/#how-it-works", label: "How it works", match: () => false },
  { to: "/login", label: "For hospitals", match: (path: string) => path === "/login" },
];

export function PublicLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Brand />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  link.match(pathname) && "text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/login">Staff login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/start">Book appointment</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-card/40">
        <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Brand />
            <p className="max-w-sm text-sm text-muted-foreground">
              Appointments, live queues and gentle reminders for calmer hospital visits.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:items-end">
            <div className="flex flex-wrap gap-4">
              <Link to="/start" className="transition-colors hover:text-foreground">
                Book
              </Link>
              <Link to="/login" className="transition-colors hover:text-foreground">
                Staff login
              </Link>
              <Link to="/patient" className="transition-colors hover:text-foreground">
                Patient portal
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <ApiStatus />
              <span>© {new Date().getFullYear()} Waitless</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
