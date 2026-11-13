import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

describe("web smoke", () => {
  it("renders core primitives", () => {
    render(
      <div>
        <Button>Book now</Button>
        <Badge variant="success">Ready</Badge>
      </div>,
    );

    expect(screen.getByRole("button", { name: "Book now" })).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });
});
