import { CalendarPlus, Home, ListOrdered, LogOut, Repeat2, Ticket } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Brand } from "@/components/shared/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/patient", label: "Home", icon: Home, end: true },
  { to: "/patient/book", label: "Book", icon: CalendarPlus },
  { to: "/patient/appointments", label: "Visits", icon: Ticket },
  { to: "/patient/queue", label: "Queue", icon: ListOrdered },
  { to: "/patient/swaps", label: "Swaps", icon: Repeat2 },
];

export function PatientLayout() {
  const { patientProfile, logout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    toast.success("Signed out");
    navigate("/", { replace: true });
  }

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
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-muted-foreground">{patientProfile?.fullName ?? "Patient"}</span>
              {patientProfile && !patientProfile.phoneVerified && (
                <Badge variant="warning" className="text-[10px]">Verify later</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="size-4" />
              Exit
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
