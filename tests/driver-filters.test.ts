import { describe, it, expect } from "vitest";
import { type Driver, type TripAssignment } from "@/types";
import {
  filterDrivers,
  getLicenseStatus,
  isDriverAvailable,
} from "@/lib/driver-filters";

function mkDriver(p: Partial<Driver>): Driver {
  return {
    id: p.id ?? crypto.randomUUID(),
    parkId: p.parkId ?? "park1",
    name: p.name ?? "Driver",
    phone: p.phone ?? "0803 000 0000",
    licenseNumber: p.licenseNumber ?? "BASE-0",
    licenseExpiry:
      p.licenseExpiry ?? new Date(Date.now() + 86400000).toISOString(),
    qualifiedRoute: p.qualifiedRoute ?? "Lagos",
    isActive: p.isActive ?? true,
    rating: p.rating,
    vehiclePlateNumber: p.vehiclePlateNumber,
    address: p.address,
    photo: p.photo,
    documents: p.documents,
    createdAt: p.createdAt ?? new Date().toISOString(),
    updatedAt: p.updatedAt ?? new Date().toISOString(),
  };
}

describe("Driver filters", () => {
  const today = new Date();
  const todayStr = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).toISOString();

  const drivers: Driver[] = [
    mkDriver({ id: "d1", name: "A", qualifiedRoute: "Lagos", rating: 5 }),
    mkDriver({
      id: "d2",
      name: "B",
      qualifiedRoute: "Abuja",
      isActive: false,
      rating: 3,
    }),
    mkDriver({
      id: "d3",
      name: "C",
      qualifiedRoute: "Abuja",
      rating: 4,
      licenseExpiry: new Date(Date.now() - 86400000).toISOString(),
    }),
  ];

  const assignments: TripAssignment[] = [
    {
      id: "t1",
      parkId: "park1",
      routeId: "route-lagos",
      driverId: "d1",
      tripDate: todayStr,
      vehicleCapacity: 18,
      status: "SCHEDULED",
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it("computes license status", () => {
    expect(getLicenseStatus(drivers[0])).toBe("valid");
    expect(getLicenseStatus(drivers[2])).toBe("expired");
  });

  it("infers availability by absence of assignment on date", () => {
    expect(isDriverAvailable(drivers[0], assignments, new Date(todayStr))).toBe(
      false
    );
    expect(isDriverAvailable(drivers[1], assignments, new Date(todayStr))).toBe(
      true
    );
  });

  it("filters by qualification (destination) and status and rating and license status", () => {
    const result = filterDrivers(drivers, {
      destination: "Lagos",
      status: "active",
      minRating: 4,
      license: "valid",
    });
    expect(result.map((d) => d.id)).toEqual(["d1"]);
  });

  it("filters by availability for a given date (no route constraint here)", () => {
    const result = filterDrivers(
      drivers,
      {
        date: new Date(todayStr),
        availability: "available",
      },
      assignments
    );
    expect(result.map((d) => d.id).sort()).toEqual(["d2", "d3"].sort());
  });
});
