import { Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <Brand />
        <div className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Compass className="size-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground">
            The page you're looking for has moved, expired or never existed.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/">Go home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/patient">Patient portal</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
