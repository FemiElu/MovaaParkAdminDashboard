import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RouteCard } from "@/components/routes/route-card";

// Mock next/link for testing
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

// 1. RouteCard minimal info and driver count

describe("RouteCard", () => {
  it("shows route name, status, and driver count", () => {
    render(
      <RouteCard
        route={{
          id: "r1",
          parkId: "p1",
          destination: "Ibadan",
          basePrice: 2000,
          vehicleCapacity: 14,
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        }}
        driverCount={3}
      />
    );
    expect(screen.getByText("Ibadan")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("3 Drivers")).toBeInTheDocument();
  });
});

// 2. Route detail page (integration test)
// We'll mock fetch and test the main features
import * as nextRouter from "next/navigation";

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn() }),
  };
});

// Mock fetch for route and drivers
const mockRoute = {
  id: "r1",
  parkId: "p1",
  destination: "Ibadan",
  basePrice: 2000,
  vehicleCapacity: 14,
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};
const mockDrivers = [
  {
    id: "d1",
    parkId: "p1",
    name: "John Doe",
    phone: "+2348000000000",
    licenseNumber: "LIC123",
    qualifiedRoute: "Ibadan",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "d2",
    parkId: "p1",
    name: "Jane Smith",
    phone: "+2348111111111",
    licenseNumber: "LIC456",
    qualifiedRoute: "Ibadan",
    isActive: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// We'll only test the client component logic for base fare editing, not the server page
import { EditBaseFare } from "@/components/routes/edit-base-fare";

describe("EditBaseFare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { ...mockRoute, basePrice: 3000 },
      }),
    });
  });

  it("renders base fare input and save button", () => {
    render(<EditBaseFare route={mockRoute} />);
    expect(screen.getByLabelText(/base fare/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("updates base fare and shows success message", async () => {
    render(<EditBaseFare route={mockRoute} />);
    const input = screen.getByLabelText(/base fare/i);
    fireEvent.change(input, { target: { value: "3000" } });
    // Find all Save buttons and click the first enabled one
    const saveButtons = screen.getAllByRole("button", { name: /save/i });
    const enabledButton = saveButtons.find((btn) => !btn.disabled);
    fireEvent.click(enabledButton!);
    await waitFor(() => {
      expect(screen.getByText(/base fare updated/i)).toBeInTheDocument();
    });
  });
});
