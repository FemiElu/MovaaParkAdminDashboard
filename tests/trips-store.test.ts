import { tripsStore, Vehicle, Trip, Booking, Parcel } from "@/lib/trips-store";

describe("TripsStore", () => {
  beforeEach(() => {
    // Reset the store state before each test
    (globalThis as any).__tripsData = undefined;
  });

  describe("Data Models and Initialization", () => {
    it("should initialize with mock data", () => {
      const vehicles = tripsStore.getVehicles();
      const trips = tripsStore.getTrips();
      const bookings = tripsStore.getBookings();
      const parcels = tripsStore.getParcels();

      expect(vehicles.length).toBeGreaterThan(0);
      expect(trips.length).toBeGreaterThan(0);
      expect(bookings.length).toBeGreaterThan(0);
      expect(parcels.length).toBeGreaterThan(0);
    });

    it("should have valid vehicle data structure", () => {
      const vehicles = tripsStore.getVehicles();
      const vehicle = vehicles[0];

      expect(vehicle).toHaveProperty("id");
      expect(vehicle).toHaveProperty("name");
      expect(vehicle).toHaveProperty("seatCount");
      expect(vehicle).toHaveProperty("maxParcelsPerVehicle");
      expect(vehicle).toHaveProperty("parkId");
      expect(typeof vehicle.seatCount).toBe("number");
      expect(typeof vehicle.maxParcelsPerVehicle).toBe("number");
    });

    it("should have valid trip data structure", () => {
      const trips = tripsStore.getTrips();
      const trip = trips[0];

      expect(trip).toHaveProperty("id");
      expect(trip).toHaveProperty("parkId");
      expect(trip).toHaveProperty("routeId");
      expect(trip).toHaveProperty("date");
      expect(trip).toHaveProperty("unitTime");
      expect(trip).toHaveProperty("vehicleId");
      expect(trip).toHaveProperty("seatCount");
      expect(trip).toHaveProperty("confirmedBookingsCount");
      expect(trip).toHaveProperty("status");
      expect(trip).toHaveProperty("payoutStatus");
    });
  });

  describe("Trip Management", () => {
    it("should get trips by park ID", () => {
      const parkId = "lekki-phase-1-motor-park";
      const trips = tripsStore.getTrips(parkId);

      expect(trips.every((trip) => trip.parkId === parkId)).toBe(true);
    });

    it("should get trips by date", () => {
      const date = "2025-08-29";
      const trips = tripsStore.getTrips(undefined, date);

      expect(trips.every((trip) => trip.date === date)).toBe(true);
    });

    it("should get trips by park ID and date", () => {
      const parkId = "lekki-phase-1-motor-park";
      const date = "2025-08-29";
      const trips = tripsStore.getTrips(parkId, date);

      expect(
        trips.every((trip) => trip.parkId === parkId && trip.date === date)
      ).toBe(true);
    });

    it("should get specific trip by ID", () => {
      const trips = tripsStore.getTrips();
      const trip = trips[0];
      const foundTrip = tripsStore.getTrip(trip.id);

      expect(foundTrip).toEqual(trip);
    });

    it("should return null for non-existent trip", () => {
      const foundTrip = tripsStore.getTrip("non-existent-id");
      expect(foundTrip).toBeNull();
    });

    it("should have trips available", () => {
      const trips = tripsStore.getTrips();
      expect(trips.length).toBeGreaterThan(0);

      const trip = trips[0];
      expect(trip).toHaveProperty("id");
      expect(trip).toHaveProperty("parkId");
      expect(trip).toHaveProperty("routeId");
      expect(trip).toHaveProperty("date");
      expect(trip).toHaveProperty("unitTime");
    });
  });

  describe("Booking Management", () => {
    it("should create a booking for a trip", () => {
      const trips = tripsStore.getTrips();
      const trip = trips[0];

      const bookingData = {
        passengerName: "John Doe",
        passengerPhone: "+2348012345678",
        nokName: "Jane Doe",
        nokPhone: "+2348012345679",
        nokAddress: "123 Test Street",
        amountPaid: 5000,
        bookingStatus: "confirmed" as const,
        paymentStatus: "confirmed" as const,
        seatNumber: 1,
        checkedIn: false,
        updatedAt: new Date().toISOString(),
      };

      const booking = tripsStore.createBooking(trip.id, bookingData);

      expect(booking).toBeTruthy();
      expect(booking?.tripId).toBe(trip.id);
      expect(booking?.passengerName).toBe(bookingData.passengerName);
    });

    it("should enforce seat count limits", () => {
      const trips = tripsStore.getTrips();
      const trip = trips[0];
      const initialBookings = tripsStore.getBookings(trip.id);
      const availableSeats = trip.seatCount - initialBookings.length;

      // Try to create more bookings than seats available
      let successfulBookings = 0;
      for (let i = 0; i < trip.seatCount + 5; i++) {
        const bookingData = {
          passengerName: `Passenger ${i}`,
          passengerPhone: `+234801234567${i}`,
          nokName: `NOK ${i}`,
          nokPhone: `+234801234568${i}`,
          nokAddress: `${i} Test Street`,
          amountPaid: 5000,
          bookingStatus: "confirmed" as const,
          paymentStatus: "confirmed" as const,
          seatNumber: i + 1,
          checkedIn: false,
          updatedAt: new Date().toISOString(),
        };

        const booking = tripsStore.createBooking(trip.id, bookingData);

        if (booking) {
          successfulBookings++;
        }
      }

      // Should not exceed the seat count
      const finalBookings = tripsStore.getBookings(trip.id);
      expect(finalBookings.length).toBeLessThanOrEqual(trip.seatCount);
      expect(successfulBookings).toBeLessThanOrEqual(availableSeats);
    });

    it("should get bookings by trip ID", () => {
      const trips = tripsStore.getTrips();
      const trip = trips[0];
      const bookings = tripsStore.getBookings(trip.id);

      expect(bookings.every((booking) => booking.tripId === trip.id)).toBe(
        true
      );
    });

    it("should check in a booking", () => {
      const trips = tripsStore.getTrips();
      const trip = trips[0];
      const bookings = tripsStore.getBookings(trip.id);

      if (bookings.length > 0) {
        const booking = bookings[0];
        const result = tripsStore.checkInBooking(trip.id, booking.id);

        expect(result.success).toBe(true);
      }
    });
  });

  describe("Driver Assignment", () => {
    it("should assign driver to a trip", () => {
      const trips = tripsStore.getTrips();
      const trip = trips[0];
      const drivers = tripsStore.getDrivers(trip.parkId);
      const driver = drivers[0];

      const result = tripsStore.assignDriver(trip.id, driver.id);

      expect(result.success).toBe(true);

      const updatedTrip = tripsStore.getTrip(trip.id);
      expect(updatedTrip?.driverId).toBe(driver.id);
    });

    it("should detect driver conflicts", () => {
      const trips = tripsStore.getTrips();
      const trip1 = trips[0];
      const trip2 = trips.find(
        (t) => t.id !== trip1.id && t.date === trip1.date
      );

      if (trip2) {
        const drivers = tripsStore.getDrivers(trip1.parkId);
        const driver = drivers[0];

        // Assign driver to first trip
        tripsStore.assignDriver(trip1.id, driver.id);

        // Try to assign same driver to second trip (should conflict)
        const result = tripsStore.assignDriver(trip2.id, driver.id);

        expect(result.success).toBe(false);
        expect(result.conflictTripId).toBe(trip1.id);
      }
    });
  });

  describe("Parcel Assignment", () => {
    it("should assign parcels to a trip", () => {
      const trips = tripsStore.getTrips();
      const trip = trips[0];
      const parcels = tripsStore.getParcels();
      const unassignedParcels = parcels.filter((p) => !p.assignedTripId);

      if (unassignedParcels.length > 0) {
        const parcelIds = unassignedParcels.slice(0, 3).map((p) => p.id);
        const result = tripsStore.assignParcels(trip.id, parcelIds);

        expect(result.success).toBe(true);
      }
    });

    it("should enforce parcel capacity limits", () => {
      const trips = tripsStore.getTrips();
      const trip = trips[0];
      const parcels = tripsStore.getParcels();
      const unassignedParcels = parcels.filter((p) => !p.assignedTripId);

      if (unassignedParcels.length > trip.maxParcelsPerVehicle) {
        const parcelIds = unassignedParcels.map((p) => p.id);
        const result = tripsStore.assignParcels(trip.id, parcelIds);

        expect(result.success).toBe(false);
        expect(result.reason).toContain("Would exceed vehicle capacity");
      }
    });

    it("should allow parcel assignment with override", () => {
      const trips = tripsStore.getTrips();
      const trip = trips[0];
      const parcels = tripsStore.getParcels();
      const unassignedParcels = parcels.filter((p) => !p.assignedTripId);

      if (unassignedParcels.length > trip.maxParcelsPerVehicle) {
        const parcelIds = unassignedParcels.map((p) => p.id);
        const result = tripsStore.assignParcels(trip.id, parcelIds, true);

        expect(result.success).toBe(true);
      }
    });
  });

  describe("Financial Calculations", () => {
    it("should calculate trip finance correctly", () => {
      const trips = tripsStore.getTrips();
      const trip = trips[0];

      const finance = tripsStore.getTripFinance(trip.id);

      expect(finance).toHaveProperty("tripId", trip.id);
      expect(finance).toHaveProperty("passengerRevenue");
      expect(finance).toHaveProperty("parcelRevenue");
      expect(finance).toHaveProperty("totalRevenue");
      expect(finance).toHaveProperty("driverTotal");
      expect(finance).toHaveProperty("parkTotal");
      expect(finance).toHaveProperty("payoutStatus");
    });

    it("should calculate correct revenue splits", () => {
      const trips = tripsStore.getTrips();
      const trip = trips[0];
      const bookings = tripsStore.getBookings(trip.id);
      const parcels = tripsStore.getParcels(trip.id);

      const passengerRevenue = bookings
        .filter((b) => b.bookingStatus === "confirmed")
        .reduce((sum, b) => sum + b.amountPaid, 0);

      const parcelRevenue = parcels
        .filter(
          (p) =>
            p.status === "assigned" ||
            p.status === "in-transit" ||
            p.status === "delivered"
        )
        .reduce((sum, p) => sum + p.fee, 0);

      const finance = tripsStore.getTripFinance(trip.id);

      expect(finance.passengerRevenue).toBe(passengerRevenue);
      expect(finance.parcelRevenue).toBe(parcelRevenue);
      expect(finance.driverPassengerSplit).toBe(passengerRevenue * 0.8);
      expect(finance.parkPassengerSplit).toBe(passengerRevenue * 0.2);
      expect(finance.driverParcelSplit).toBe(parcelRevenue * 0.5);
      expect(finance.parkParcelSplit).toBe(parcelRevenue * 0.5);
    });
  });

  describe("Audit Logging", () => {
    it("should log audit events", () => {
      const trips = tripsStore.getTrips();
      const trip = trips[0];

      const auditLogs = tripsStore.getAuditLogs("Trip", trip.id);

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0]).toHaveProperty("action");
      expect(auditLogs[0]).toHaveProperty("entityType", "Trip");
      expect(auditLogs[0]).toHaveProperty("entityId", trip.id);
      expect(auditLogs[0]).toHaveProperty("performedBy");
      expect(auditLogs[0]).toHaveProperty("performedAt");
    });

    it("should log driver assignment", () => {
      const trips = tripsStore.getTrips();
      const trip = trips[0];
      const drivers = tripsStore.getDrivers(trip.parkId);
      const driver = drivers[0];

      tripsStore.assignDriver(trip.id, driver.id);

      const auditLogs = tripsStore.getAuditLogs("Trip", trip.id);
      const driverAssignmentLog = auditLogs.find(
        (log) => log.action === "driver_assigned"
      );

      expect(driverAssignmentLog).toBeTruthy();
      expect(driverAssignmentLog?.payload).toHaveProperty(
        "driverId",
        driver.id
      );
    });
  });

  describe("Data Persistence", () => {
    it("should persist data across instances", () => {
      const trips = tripsStore.getTrips();
      const originalCount = trips.length;

      // Create new instance
      const newTripsStore = new (tripsStore.constructor as any)();
      const newTrips = newTripsStore.getTrips();

      expect(newTrips.length).toBe(originalCount);
    });
  });
});
