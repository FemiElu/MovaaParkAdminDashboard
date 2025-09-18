import { NextRequest } from "next/server";
import { tripsStore } from "@/lib/trips-store";

// Mock NextAuth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: {
      id: "admin",
      parkId: "lekki-phase-1-motor-park",
    },
  }),
}));

// Mock auth options
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

describe("Trips API Routes", () => {
  beforeEach(() => {
    // Reset store state
    (globalThis as any).__tripsData = undefined;
  });

  describe("GET /api/trips", () => {
    it("should return trips for authenticated user", async () => {
      const { GET } = await import("@/app/api/trips/route");
      const request = new NextRequest("http://localhost:3000/api/trips");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });

    it("should filter trips by date", async () => {
      const { GET } = await import("@/app/api/trips/route");
      const date = "2025-08-29";
      const request = new NextRequest(
        `http://localhost:3000/api/trips?date=${date}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.every((trip: any) => trip.date === date)).toBe(true);
    });

    it("should return 401 for unauthenticated user", async () => {
      // Mock unauthenticated session
      vi.doMock("next-auth", () => ({
        getServerSession: vi.fn().mockResolvedValue(null),
      }));

      const { GET } = await import("@/app/api/trips/route");
      const request = new NextRequest("http://localhost:3000/api/trips");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe("Unauthorized");
    });
  });

  describe("POST /api/trips", () => {
    it("should create a new trip", async () => {
      const { POST } = await import("@/app/api/trips/route");

      const tripData = {
        parkId: "lekki-phase-1-motor-park",
        routeId: "Test Route",
        date: "2025-12-31",
        unitTime: "08:00",
        seatCount: 18,
        maxParcelsPerVehicle: 10,
      };

      const request = new NextRequest("http://localhost:3000/api/trips", {
        method: "POST",
        body: JSON.stringify(tripData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        parkId: tripData.parkId,
        routeId: tripData.routeId,
        date: tripData.date,
        unitTime: tripData.unitTime,
      });
    });

    it("should validate required fields", async () => {
      const { POST } = await import("@/app/api/trips/route");

      const incompleteData = {
        parkId: "lekki-phase-1-motor-park",
        routeId: "Test Route",
        // Missing required fields
      };

      const request = new NextRequest("http://localhost:3000/api/trips", {
        method: "POST",
        body: JSON.stringify(incompleteData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields");
    });

    it("should enforce vehicle seat count limits", async () => {
      const { POST } = await import("@/app/api/trips/route");

      const tripData = {
        parkId: "lekki-phase-1-motor-park",
        routeId: "Test Route",
        date: "2025-12-31",
        unitTime: "08:00",
        seatCount: 100, // Exceeds vehicle capacity
        maxParcelsPerVehicle: 10,
      };

      const request = new NextRequest("http://localhost:3000/api/trips", {
        method: "POST",
        body: JSON.stringify(tripData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No suitable vehicle found for seat count");
    });
  });

  describe("GET /api/parks/[parkId]/drivers", () => {
    it("should return drivers for a park", async () => {
      const { GET } = await import("@/app/api/parks/[parkId]/drivers/route");

      const request = new NextRequest(
        "http://localhost:3000/api/parks/lekki-phase-1-motor-park/drivers"
      );

      const response = await GET(request, {
        params: { parkId: "lekki-phase-1-motor-park" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(
        data.data.every(
          (driver: any) => driver.parkId === "lekki-phase-1-motor-park"
        )
      ).toBe(true);
    });
  });

  describe("POST /api/trips/[tripId]/assign-driver", () => {
    it("should assign driver to trip", async () => {
      const { POST } = await import(
        "@/app/api/trips/[tripId]/assign-driver/route"
      );

      const trips = tripsStore.getTrips();
      const trip = trips[0];
      const drivers = tripsStore.getDrivers(trip.parkId);
      const driver = drivers[0];

      const request = new NextRequest(
        `http://localhost:3000/api/trips/${trip.id}/assign-driver`,
        {
          method: "POST",
          body: JSON.stringify({ driverId: driver.id }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request, { params: { tripId: trip.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should detect driver conflicts", async () => {
      const { POST } = await import(
        "@/app/api/trips/[tripId]/assign-driver/route"
      );

      const trips = tripsStore.getTrips();
      const trip1 = trips[0];
      const trip2 = trips.find(
        (t) => t.id !== trip1.id && t.date === trip1.date
      );
      const drivers = tripsStore.getDrivers(trip1.parkId);
      const driver = drivers[0];

      if (trip2) {
        // Assign driver to first trip
        tripsStore.assignDriver(trip1.id, driver.id);

        // Try to assign same driver to second trip
        const request = new NextRequest(
          `http://localhost:3000/api/trips/${trip2.id}/assign-driver`,
          {
            method: "POST",
            body: JSON.stringify({ driverId: driver.id }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await POST(request, { params: { tripId: trip2.id } });
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toBe("DRIVER_CONFLICT");
        expect(data.conflictTripId).toBe(trip1.id);
      }
    });

    it("should validate driver ID", async () => {
      const { POST } = await import(
        "@/app/api/trips/[tripId]/assign-driver/route"
      );

      const trips = tripsStore.getTrips();
      const trip = trips[0];

      const request = new NextRequest(
        `http://localhost:3000/api/trips/${trip.id}/assign-driver`,
        {
          method: "POST",
          body: JSON.stringify({}), // Missing driverId
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request, { params: { tripId: trip.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("driverId is required");
    });
  });

  describe("GET /api/parks/[parkId]/parcels", () => {
    it("should return unassigned parcels", async () => {
      const { GET } = await import("@/app/api/parks/[parkId]/parcels/route");

      const request = new NextRequest(
        "http://localhost:3000/api/parks/lekki-phase-1-motor-park/parcels"
      );

      const response = await GET(request, {
        params: { parkId: "lekki-phase-1-motor-park" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.every((parcel: any) => !parcel.assignedTripId)).toBe(
        true
      );
    });
  });

  describe("POST /api/trips/[tripId]/assign-parcels", () => {
    it("should assign parcels to trip", async () => {
      const { POST } = await import(
        "@/app/api/trips/[tripId]/assign-parcels/route"
      );

      const trips = tripsStore.getTrips();
      const trip = trips[0];
      const parcels = tripsStore.getParcels();
      const unassignedParcels = parcels.filter((p) => !p.assignedTripId);

      if (unassignedParcels.length > 0) {
        const parcelIds = unassignedParcels.slice(0, 3).map((p) => p.id);

        const request = new NextRequest(
          `http://localhost:3000/api/trips/${trip.id}/assign-parcels`,
          {
            method: "POST",
            body: JSON.stringify({ parcelIds }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await POST(request, { params: { tripId: trip.id } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      }
    });

    it("should enforce parcel capacity limits", async () => {
      const { POST } = await import(
        "@/app/api/trips/[tripId]/assign-parcels/route"
      );

      const trips = tripsStore.getTrips();
      const trip = trips[0];
      const parcels = tripsStore.getParcels();
      const unassignedParcels = parcels.filter((p) => !p.assignedTripId);

      if (unassignedParcels.length > trip.maxParcelsPerVehicle) {
        const parcelIds = unassignedParcels.map((p) => p.id);

        const request = new NextRequest(
          `http://localhost:3000/api/trips/${trip.id}/assign-parcels`,
          {
            method: "POST",
            body: JSON.stringify({ parcelIds }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await POST(request, { params: { tripId: trip.id } });
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toBe("PARCEL_CAPACITY_EXCEEDED");
      }
    });

    it("should allow override for capacity limits", async () => {
      const { POST } = await import(
        "@/app/api/trips/[tripId]/assign-parcels/route"
      );

      const trips = tripsStore.getTrips();
      const trip = trips[0];
      const parcels = tripsStore.getParcels();
      const unassignedParcels = parcels.filter((p) => !p.assignedTripId);

      if (unassignedParcels.length > trip.maxParcelsPerVehicle) {
        const parcelIds = unassignedParcels.map((p) => p.id);

        const request = new NextRequest(
          `http://localhost:3000/api/trips/${trip.id}/assign-parcels`,
          {
            method: "POST",
            body: JSON.stringify({ parcelIds, override: true }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await POST(request, { params: { tripId: trip.id } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      }
    });

    it("should validate parcel IDs", async () => {
      const { POST } = await import(
        "@/app/api/trips/[tripId]/assign-parcels/route"
      );

      const trips = tripsStore.getTrips();
      const trip = trips[0];

      const request = new NextRequest(
        `http://localhost:3000/api/trips/${trip.id}/assign-parcels`,
        {
          method: "POST",
          body: JSON.stringify({}), // Missing parcelIds
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request, { params: { tripId: trip.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("parcelIds is required");
    });
  });

  describe("POST /api/trips/[tripId]/checkin", () => {
    it("should check in a booking", async () => {
      const { POST } = await import("@/app/api/trips/[tripId]/checkin/route");

      const trips = tripsStore.getTrips();
      const trip = trips[0];
      const bookings = tripsStore.getBookings(trip.id);

      if (bookings.length > 0) {
        const booking = bookings[0];

        const request = new NextRequest(
          `http://localhost:3000/api/trips/${trip.id}/checkin`,
          {
            method: "POST",
            body: JSON.stringify({ bookingId: booking.id }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await POST(request, { params: { tripId: trip.id } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      }
    });

    it("should validate booking ID", async () => {
      const { POST } = await import("@/app/api/trips/[tripId]/checkin/route");

      const trips = tripsStore.getTrips();
      const trip = trips[0];

      const request = new NextRequest(
        `http://localhost:3000/api/trips/${trip.id}/checkin`,
        {
          method: "POST",
          body: JSON.stringify({}), // Missing bookingId
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request, { params: { tripId: trip.id } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("bookingId is required");
    });
  });
});
