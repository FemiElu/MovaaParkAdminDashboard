import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Driver } from "@/types";
import DriverList from "@/components/drivers/driver-list";

function mkDriver(p: Partial<Driver>): Driver {
  return {
    id: p.id ?? "d1",
    parkId: p.parkId ?? "park1",
    name: p.name ?? "John Doe",
    phone: p.phone ?? "+2348030000000",
    licenseNumber: p.licenseNumber ?? "AAA000-0",
    licenseExpiry: p.licenseExpiry,
    qualifiedRoute: p.qualifiedRoute ?? "Lagos",
    isActive: p.isActive ?? true,
    rating: p.rating ?? 4,
    vehiclePlateNumber: p.vehiclePlateNumber,
    address: p.address,
    photo: p.photo,
    documents: p.documents,
    createdAt: p.createdAt ?? new Date().toISOString(),
    updatedAt: p.updatedAt ?? new Date().toISOString(),
  };
}

describe("DriverList", () => {
  it("renders license expiry chips (expired and expiring soon)", () => {
    const expired = mkDriver({
      id: "e",
      name: "Alpha",
      licenseExpiry: new Date(Date.now() - 86400000).toISOString(),
    });
    const soon = mkDriver({
      id: "s",
      name: "Bravo",
      licenseExpiry: new Date(Date.now() + 5 * 86400000).toISOString(),
    });
    const ok = mkDriver({
      id: "o",
      name: "Charlie",
      licenseExpiry: new Date(Date.now() + 30 * 86400000).toISOString(),
    });
    const { container } = render(<DriverList drivers={[expired, soon, ok]} />);
    const root = container;
    expect(screen.getAllByText(/Expired/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Expiring soon/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Valid/i).length).toBeGreaterThan(0);
  });

  // Quick actions are only shown on detail view per spec
});
