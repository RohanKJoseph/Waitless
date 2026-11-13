import { CalendarPlus, Home, ListOrdered, Repeat2, Ticket } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/patient", label: "Home", icon: Home, end: true },
  { to: "/patient/book", label: "Book", icon: CalendarPlus },
  { to: "/patient/appointments", label: "Visits", icon: Ticket },
  { to: "/patient/queue", label: "Queue", icon: ListOrdered },
  { to: "/patient/swaps", label: "Swaps", icon: Repeat2 },
];

export function PatientLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Brand to="/patient" />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Patient">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    isActive && "bg-accent text-accent-foreground",
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">Guest</span>
            <Button variant="outline" size="sm" asChild>
              <a href="/">Exit</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container-page flex-1 py-6 pb-24 md:py-8 md:pb-12">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Patient bottom navigation"
      >
        <div className="grid grid-cols-5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors",
                  isActive && "text-primary",
                )
              }
            >
              <item.icon className="size-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
