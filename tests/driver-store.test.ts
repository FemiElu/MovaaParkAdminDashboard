import { describe, it, expect, beforeEach } from "vitest";
import {
  resetDemoDrivers,
  createDriver,
  listDrivers,
  type CreateDriverInput,
} from "@/lib/drivers-store";

beforeEach(() => {
  resetDemoDrivers();
});

describe("drivers-store", () => {
  it("creates a driver and enforces unique license per park", () => {
    const parkId = "park1";
    const base = "KDJ7A9";
    const d1: CreateDriverInput = {
      parkId,
      name: "John",
      phone: "0803 000 0000",
      licenseNumber: "KDJ7A9-0",
      licenseExpiry: new Date(Date.now() + 86400000).toISOString(),
      qualifiedRoute: "Lagos",
      isActive: true,
      rating: 4,
    };
    const a = createDriver(d1);
    expect(a.id).toBeTruthy();
    expect(() => createDriver({ ...d1, name: "Jane" })).toThrowError(
      /already exists/i
    );

    // Same license in different park is allowed (for now)
    const b = createDriver({ ...d1, parkId: "park2" });
    expect(b.parkId).toBe("park2");
  });

  it("lists by filters: destination, status, rating, license, availability", () => {
    const today = new Date();
    const todayStr = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).toISOString();
    const a = createDriver({
      parkId: "park1",
      name: "A",
      phone: "0803",
      licenseNumber: "AAA000-0",
      licenseExpiry: new Date(Date.now() + 86400000).toISOString(),
      qualifiedRoute: "Lagos",
      isActive: true,
      rating: 5,
    });
    const b = createDriver({
      parkId: "park1",
      name: "B",
      phone: "0803",
      licenseNumber: "BBB000-0",
      licenseExpiry: new Date(Date.now() - 86400000).toISOString(),
      qualifiedRoute: "Abuja",
      isActive: false,
      rating: 3,
    });

    // Simulate one assignment for A today
    const result1 = listDrivers("park1", { destination: "Lagos" }, [
      {
        id: "t1",
        parkId: "park1",
        routeId: "r1",
        driverId: a.id,
        tripDate: todayStr,
        vehicleCapacity: 18,
        status: "SCHEDULED",
        assignedAt: todayStr,
        updatedAt: todayStr,
      },
    ]);
    expect(result1.data.length).toBe(1);
    expect(result1.data[0].id).toBe(a.id);

    const result2 = listDrivers(
      "park1",
      { availability: "available", date: new Date(todayStr) },
      []
    );
    expect(result2.data.map((d) => d.id).sort()).toEqual([a.id, b.id].sort());
  });
});
