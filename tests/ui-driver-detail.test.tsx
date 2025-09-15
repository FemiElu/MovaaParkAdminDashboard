import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Driver } from "@/types";
import DriverDetail from "@/components/drivers/driver-detail";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const driver: Driver = {
  id: "d1",
  parkId: "park1",
  name: "John Doe",
  phone: "+2348030000000",
  licenseNumber: "AAA000-0",
  licenseExpiry: new Date(Date.now() - 86400000).toISOString(),
  qualifiedRoute: "Lagos",
  isActive: true,
  rating: 4,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("DriverDetail", () => {
  it("shows an expiry banner when license is expired", () => {
    render(<DriverDetail driver={driver} />);
    expect(
      screen.getByRole("alert", { name: /License expired/i })
    ).toBeInTheDocument();
  });
});
