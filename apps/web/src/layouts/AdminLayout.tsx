import {
  CalendarDays,
  LayoutDashboard,
  ListOrdered,
  Repeat2,
  Settings,
  Stethoscope,
  Users,
  Building2,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/admin/queue", label: "Queue", icon: ListOrdered },
  { to: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { to: "/admin/departments", label: "Departments", icon: Building2 },
  { to: "/admin/patients", label: "Patients", icon: Users },
  { to: "/admin/swaps", label: "Swaps", icon: Repeat2 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout() {
  return (
    <div className="min-h-dvh bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center border-b px-5">
          <Brand to="/admin" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  isActive && "bg-accent text-accent-foreground shadow-sm",
                )
              }
            >
              <item.icon className="size-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs font-medium">Demo hospital</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Seeded data · Asia/Kolkata
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="lg:hidden">
              <Brand to="/admin" compact />
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <span className="text-sm text-muted-foreground">Hospital operations</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/">Patient app</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="/login">Sign out</a>
              </Button>
            </div>
          </div>

          <nav
            className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden"
            aria-label="Admin mobile"
          >
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground",
                    isActive && "border-primary/30 bg-accent text-accent-foreground",
                  )
                }
              >
                <item.icon className="size-3.5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
