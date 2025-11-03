import React from "react";
// React import required for JSX transform in the test environment
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, beforeEach, vi } from "vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Ensure global.fetch is mocked
global.fetch = vi.fn();

import { DashboardOverview } from "@/components/dashboard/overview";

describe("DashboardOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders mapped stats from admin-stat API", async () => {
    const apiResponse = {
      message: "Success",
      data: {
        total_booking: 5,
        total_earning: 125000,
        total_active_trips: 3,
        total_drivers: 7,
        top_routes: [
          { destination: "Ibadan", bookings: 45, revenue: 180000 },
        ],
      },
    };

    const mockedFetch = global.fetch as unknown as { mockResolvedValue: (v: unknown) => void };
    mockedFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(apiResponse),
    });

    render(<DashboardOverview parkId="park-1" />);

    // Wait for the top route to show up (unique marker)
    await waitFor(() => {
      expect(screen.getByText(/Ibadan/)).toBeInTheDocument();
    });

  // Check key numeric stats are rendered
  expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    // Top route destination
    expect(screen.getByText(/Ibadan/)).toBeInTheDocument();
  });

  it("shows error banner when fetch fails", async () => {
    const mockedFetch = global.fetch as unknown as { mockResolvedValue: (v: unknown) => void };
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({ message: "Not found" }),
    });

    render(<DashboardOverview parkId="park-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });
});
