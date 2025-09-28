// In-memory Trips Store for Movaa Park Admin
// Data models and store logic for Trip, Booking, Driver, Parcel, AuditLog, Adjustment, Vehicle
// Persists data across reloads using globalThis and localStorage

import { listRoutes } from "./routes-store";
import {
  Trip,
  Booking,
  Vehicle,
  RecurrencePattern,
  TripFormData,
} from "@/types";

// Re-export types for backward compatibility
export type { Trip, Booking, Vehicle, RecurrencePattern, TripFormData };

export interface Parcel {
  id: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhoneMasked: string; // masked until OTP release
  receiverPhone?: string; // unmasked after OTP release
  fee: number;
  assignedTripId?: string;
  status: "unassigned" | "assigned" | "in-transit" | "delivered";
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  payload: Record<string, unknown>;
  performedBy: string;
  performedAt: string;
}

export interface Adjustment {
  id: string;
  tripId: string;
  amount: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface TripFinance {
  tripId: string;
  passengerRevenue: number;
  parcelRevenue: number;
  totalRevenue: number;
  driverPassengerSplit: number; // 80%
  parkPassengerSplit: number; // 20%
  driverParcelSplit: number; // 50%
  parkParcelSplit: number; // 50%
  driverTotal: number;
  parkTotal: number;
  adjustments: Adjustment[];
  payoutStatus: Trip["payoutStatus"];
}

// Mock Data - Nigerian context
const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "vehicle_1",
    name: "Bus A - 18 Seater",
    seatCount: 18,
    maxParcelsPerVehicle: 10,
    parkId: "lekki-phase-1-motor-park",
  },
  {
    id: "vehicle_2",
    name: "Bus B - 16 Seater",
    seatCount: 16,
    maxParcelsPerVehicle: 8,
    parkId: "lekki-phase-1-motor-park",
  },
  {
    id: "vehicle_3",
    name: "Bus C - 20 Seater",
    seatCount: 20,
    maxParcelsPerVehicle: 12,
    parkId: "ikeja-motor-park",
  },
  {
    id: "vehicle_4",
    name: "Bus D - 18 Seater",
    seatCount: 18,
    maxParcelsPerVehicle: 10,
    parkId: "ikeja-motor-park",
  },
  {
    id: "vehicle_5",
    name: "Bus E - 16 Seater",
    seatCount: 16,
    maxParcelsPerVehicle: 8,
    parkId: "ajah-motor-park",
  },
];

// Routes are now fetched from the routes store

const MOCK_DRIVERS = [
  {
    id: "driver_1",
    name: "Ahmed Musa",
    phone: "+2348012345678",
    rating: 4.8,
    parkId: "lekki-phase-1-motor-park",
    routeIds: ["r_lekk_1"], // Lagos route
  },
  {
    id: "driver_2",
    name: "Fatima Ibrahim",
    phone: "+2348023456789",
    rating: 4.6,
    parkId: "lekki-phase-1-motor-park",
    routeIds: ["r_lekk_1", "r_lekk_2"], // Lagos and Abuja routes
  },
  {
    id: "driver_3",
    name: "Emeka Okafor",
    phone: "+2348034567890",
    rating: 4.9,
    parkId: "ikeja-motor-park",
    routeIds: ["r_ikej_1"], // Ibadan route
  },
  {
    id: "driver_4",
    name: "Aisha Mohammed",
    phone: "+2348045678901",
    rating: 4.7,
    parkId: "ikeja-motor-park",
    routeIds: ["r_ikej_1", "r_ikej_2"], // Ibadan and Ilesa routes
  },
  {
    id: "driver_5",
    name: "Chinedu Anyanwu",
    phone: "+2348056789012",
    rating: 4.5,
    parkId: "ajah-motor-park",
    routeIds: ["r_ajah_1"], // Ibadan route from Ajah
  },
  {
    id: "driver_6",
    name: "Blessing Eze",
    phone: "+2348067890123",
    rating: 4.8,
    parkId: "lekki-phase-1-motor-park",
    routeIds: ["r_lekk_2"], // Abuja route
  },
  {
    id: "driver_7",
    name: "Yusuf Bello",
    phone: "+2348078901234",
    rating: 4.4,
    parkId: "ikeja-motor-park",
    routeIds: ["r_ikej_2"], // Ilesa route
  },
  {
    id: "driver_8",
    name: "Kemi Adebayo",
    phone: "+2348089012345",
    rating: 4.9,
    parkId: "ajah-motor-park",
    routeIds: ["r_ajah_1"], // Ibadan route from Ajah
  },
];

// In-memory store with persistence
declare global {
  var __tripsData:
    | {
        vehicles: Vehicle[];
        trips: Trip[];
        bookings: Booking[];
        parcels: Parcel[];
        auditLogs: AuditLog[];
        adjustments: Adjustment[];
      }
    | undefined;
}

class TripsStore {
  private vehicles: Vehicle[] = [];
  private trips: Trip[] = [];
  private bookings: Booking[] = [];
  private parcels: Parcel[] = [];
  private auditLogs: AuditLog[] = [];
  private adjustments: Adjustment[] = [];
  private seatHoldTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.loadFromGlobal();
    this.seedMockData();
  }

  private loadFromGlobal() {
    if (typeof globalThis !== "undefined" && globalThis.__tripsData) {
      const data = globalThis.__tripsData;
      this.vehicles = data.vehicles || [];
      this.trips = data.trips || [];
      this.bookings = data.bookings || [];
      this.parcels = data.parcels || [];
      this.auditLogs = data.auditLogs || [];
      this.adjustments = data.adjustments || [];
    }
  }

  private persistToGlobal() {
    if (typeof globalThis !== "undefined") {
      globalThis.__tripsData = {
        vehicles: this.vehicles,
        trips: this.trips,
        bookings: this.bookings,
        parcels: this.parcels,
        auditLogs: this.auditLogs,
        adjustments: this.adjustments,
      };
    }
  }

  private logAudit(
    action: string,
    entityType: string,
    entityId: string,
    payload: Record<string, unknown>
  ) {
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      entityType,
      entityId,
      action,
      payload,
      performedBy: "admin",
      performedAt: new Date().toISOString(),
    };
    this.auditLogs.push(log);
    this.persistToGlobal();
  }

  private seedMockData() {
    if (this.vehicles.length === 0) {
      this.vehicles = [...MOCK_VEHICLES];
    }

    if (this.trips.length === 0) {
      // Create trips for next 7 days using real routes
      const today = new Date();
      const parkIds = [
        "lekki-phase-1-motor-park",
        "ikeja-motor-park",
        "ajah-motor-park",
      ];

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];

        // Create trips for each park using their actual routes
        parkIds.forEach((parkId) => {
          const routes = listRoutes(parkId);
          const vehicle = this.vehicles.find((v) => v.parkId === parkId);

          if (vehicle) {
            routes.forEach((route) => {
              if (route.isActive) {
                const trip: Trip = {
                  id: `trip_${dateStr}_${route.id}`,
                  parkId,
                  routeId: route.id,
                  date: dateStr,
                  unitTime: "06:00",
                  seatCount: vehicle.seatCount,
                  confirmedBookingsCount: 0,
                  maxParcelsPerVehicle: vehicle.maxParcelsPerVehicle,
                  price: 5000, // Default price since routes no longer have basePrice
                  status: "draft",
                  payoutStatus: "NotScheduled",
                  isRecurring: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                this.trips.push(trip);
              }
            });
          }
        });
      }
    }

    if (this.bookings.length === 0) {
      this.seedMockBookings();
    }

    if (this.parcels.length === 0) {
      this.seedMockParcels();
    }

    this.persistToGlobal();
  }

  private seedMockBookings() {
    const nigerianNames = [
      "Adebayo Johnson",
      "Chioma Okafor",
      "Emeka Nwankwo",
      "Fatima Abdullahi",
      "Ibrahim Hassan",
      "Aisha Mohammed",
      "Olumide Adeyemi",
      "Ngozi Okoro",
      "Yusuf Musa",
      "Blessing Eze",
      "Kehinde Ogbonna",
      "Zainab Ali",
      "Tunde Ogundimu",
      "Amina Garba",
      "Chinedu Anyanwu",
      "Kemi Adebisi",
    ];

    const addresses = [
      "15 Victoria Island, Lagos",
      "Block 12, Lekki Phase 1, Lagos",
      "45 Allen Avenue, Ikeja, Lagos",
      "23 Surulere Street, Surulere, Lagos",
      "8 Maryland Mall Road, Maryland, Lagos",
      "67 Ikoyi Crescent, Ikoyi, Lagos",
    ];

    // Special case: 17 confirmed bookings for Ajah→Ibadan on 2025-08-29
    const ajahTrip = this.trips.find(
      (t) => t.routeId === "r_ajah_1" && t.date === "2025-08-29"
    );
    if (ajahTrip) {
      for (let i = 1; i <= 17; i++) {
        const name = nigerianNames[i % nigerianNames.length];
        const booking: Booking = {
          id: `booking_ajah_${i}`,
          tripId: ajahTrip.id,
          passengerName: name,
          passengerPhone: `+234${
            Math.floor(Math.random() * 900000000) + 700000000
          }`,
          nokName: nigerianNames[(i + 1) % nigerianNames.length],
          nokPhone: `+234${Math.floor(Math.random() * 900000000) + 700000000}`,
          nokAddress: addresses[i % addresses.length],
          seatNumber: i,
          amountPaid: 2000,
          paymentStatus: "confirmed",
          bookingStatus: "confirmed",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.bookings.push(booking);
        ajahTrip.confirmedBookingsCount++;
      }
    }

    // Create remaining bookings for other trips
    const remainingTrips = this.trips.filter((t) => t.id !== ajahTrip?.id);
    let bookingCount = 0;

    remainingTrips.forEach((trip) => {
      const routes = listRoutes(trip.parkId);
      const route = routes.find((r) => r.id === trip.routeId);
      if (!route) return;

      const numBookings = Math.floor(Math.random() * 8) + 1; // 1-8 bookings per trip

      for (
        let i = 0;
        i < numBookings && trip.confirmedBookingsCount < trip.seatCount;
        i++
      ) {
        bookingCount++;
        const name = nigerianNames[bookingCount % nigerianNames.length];
        const booking: Booking = {
          id: `booking_${bookingCount}`,
          tripId: trip.id,
          passengerName: name,
          passengerPhone: `+234${
            Math.floor(Math.random() * 900000000) + 700000000
          }`,
          nokName: nigerianNames[(bookingCount + 1) % nigerianNames.length],
          nokPhone: `+234${Math.floor(Math.random() * 900000000) + 700000000}`,
          nokAddress: addresses[bookingCount % addresses.length],
          seatNumber: trip.confirmedBookingsCount + 1,
          amountPaid: 5000, // Default price since routes no longer have basePrice
          paymentStatus: "confirmed",
          bookingStatus: "confirmed",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.bookings.push(booking);
        trip.confirmedBookingsCount++;
      }
    });
  }

  private seedMockParcels() {
    const senders = [
      "John Doe",
      "Jane Smith",
      "Ahmed Ali",
      "Fatima Yusuf",
      "Emeka Okafor",
    ];
    const receivers = [
      "Mary Johnson",
      "David Brown",
      "Aisha Mohammed",
      "Chinedu Anyanwu",
      "Blessing Eze",
    ];

    for (let i = 1; i <= 25; i++) {
      const parcel: Parcel = {
        id: `parcel_${i}`,
        senderName: senders[i % senders.length],
        senderPhone: `+234${Math.floor(Math.random() * 900000000) + 700000000}`,
        receiverName: receivers[i % receivers.length],
        receiverPhoneMasked: `+234***${Math.floor(Math.random() * 10000)}`,
        fee: Math.floor(Math.random() * 3000) + 1000, // 1000-4000
        status: "unassigned",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.parcels.push(parcel);
    }
  }

  // Public API methods
  getVehicles(parkId?: string): Vehicle[] {
    if (parkId) {
      return this.vehicles.filter((v) => v.parkId === parkId);
    }
    return [...this.vehicles];
  }

  getTrips(parkId?: string, date?: string): Trip[] {
    let filteredTrips = [...this.trips];

    if (parkId) {
      filteredTrips = filteredTrips.filter((t) => t.parkId === parkId);
    }

    if (date) {
      filteredTrips = filteredTrips.filter((t) => t.date === date);
    }

    return filteredTrips.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  getTrip(tripId: string): Trip | null {
    return this.trips.find((t) => t.id === tripId) || null;
  }

  getBookings(tripId?: string): Booking[] {
    if (tripId) {
      return this.bookings.filter((b) => b.tripId === tripId);
    }
    return [...this.bookings];
  }

  getParcels(tripId?: string): Parcel[] {
    if (tripId) {
      return this.parcels.filter((p) => p.assignedTripId === tripId);
    }
    return this.parcels.filter((p) => !p.assignedTripId);
  }

  getDrivers(parkId: string, routeId?: string) {
    let filteredDrivers = MOCK_DRIVERS.filter((d) => d.parkId === parkId);

    // If routeId is provided, filter drivers assigned to that route
    if (routeId) {
      filteredDrivers = filteredDrivers.filter(
        (d) => d.routeIds && d.routeIds.includes(routeId)
      );
    }

    return filteredDrivers;
  }

  getAuditLogs(entityType?: string, entityId?: string): AuditLog[] {
    let filtered = [...this.auditLogs];

    if (entityType) {
      filtered = filtered.filter((log) => log.entityType === entityType);
    }

    if (entityId) {
      filtered = filtered.filter((log) => log.entityId === entityId);
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
    );
  }

  // Business logic methods
  createBooking(
    tripId: string,
    bookingData: Omit<Booking, "id" | "tripId" | "createdAt" | "updatedAt">
  ): Booking | null {
    const trip = this.getTrip(tripId);
    if (!trip) return null;

    // Check if seats are available
    if (trip.confirmedBookingsCount >= trip.seatCount) {
      return null; // No seats available
    }

    const booking: Booking = {
      id: `booking_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      tripId,
      ...bookingData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.bookings.push(booking);
    trip.confirmedBookingsCount++;
    trip.updatedAt = new Date().toISOString();

    this.logAudit("booking_created", "Booking", booking.id, { bookingData });
    this.persistToGlobal();

    return booking;
  }

  assignDriver(
    tripId: string,
    driverId: string
  ): { success: boolean; conflictTripId?: string } {
    const trip = this.getTrip(tripId);
    if (!trip) return { success: false };

    // Check for driver conflicts (same day, different trip)
    const driverTrips = this.trips.filter(
      (t) => t.driverId === driverId && t.date === trip.date && t.id !== tripId
    );

    if (driverTrips.length > 0) {
      return { success: false, conflictTripId: driverTrips[0].id };
    }

    trip.driverId = driverId;
    trip.updatedAt = new Date().toISOString();

    this.logAudit("driver_assigned", "Trip", tripId, { driverId });
    this.persistToGlobal();

    return { success: true };
  }

  assignParcels(
    tripId: string,
    parcelIds: string[],
    override = false
  ): { success: boolean; reason?: string } {
    const trip = this.getTrip(tripId);
    if (!trip) return { success: false, reason: "Trip not found" };

    // Vehicle information is now managed offline by Park admin

    const currentParcels = this.parcels.filter(
      (p) => p.assignedTripId === tripId
    );
    const newParcelCount = currentParcels.length + parcelIds.length;

    if (newParcelCount > trip.maxParcelsPerVehicle && !override) {
      return {
        success: false,
        reason: `Would exceed trip capacity (${trip.maxParcelsPerVehicle}). Use override to proceed.`,
      };
    }

    parcelIds.forEach((parcelId) => {
      const parcel = this.parcels.find((p) => p.id === parcelId);
      if (parcel) {
        parcel.assignedTripId = tripId;
        parcel.status = "assigned";
        parcel.updatedAt = new Date().toISOString();
      }
    });

    this.logAudit("parcels_assigned", "Trip", tripId, {
      parcelIds,
      override,
      reason: override ? "Admin override used" : undefined,
    });
    this.persistToGlobal();

    return { success: true };
  }

  getTripFinance(tripId: string): TripFinance {
    const trip = this.getTrip(tripId);
    if (!trip) throw new Error("Trip not found");

    const bookings = this.getBookings(tripId);
    const parcels = this.getParcels(tripId);
    const tripAdjustments = this.adjustments.filter((a) => a.tripId === tripId);

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

    const totalRevenue = passengerRevenue + parcelRevenue;
    const adjustmentTotal = tripAdjustments.reduce(
      (sum, adj) => sum + adj.amount,
      0
    );

    const driverPassengerSplit = passengerRevenue * 0.8;
    const parkPassengerSplit = passengerRevenue * 0.2;
    const driverParcelSplit = parcelRevenue * 0.5;
    const parkParcelSplit = parcelRevenue * 0.5;

    const driverTotal =
      driverPassengerSplit + driverParcelSplit + adjustmentTotal;
    const parkTotal = parkPassengerSplit + parkParcelSplit - adjustmentTotal;

    return {
      tripId,
      passengerRevenue,
      parcelRevenue,
      totalRevenue,
      driverPassengerSplit,
      parkPassengerSplit,
      driverParcelSplit,
      parkParcelSplit,
      driverTotal,
      parkTotal,
      adjustments: tripAdjustments,
      payoutStatus: trip.payoutStatus,
    };
  }

  addAdjustment(tripId: string, amount: number, reason: string): Adjustment {
    const adjustment: Adjustment = {
      id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      tripId,
      amount,
      reason,
      createdBy: "admin",
      createdAt: new Date().toISOString(),
    };

    this.adjustments.push(adjustment);
    this.logAudit("adjustment_added", "Trip", tripId, { amount, reason });
    this.persistToGlobal();

    return adjustment;
  }

  checkInBooking(
    tripId: string,
    bookingId: string
  ): { success: boolean; reason?: string } {
    const trip = this.getTrip(tripId);
    if (!trip) return { success: false, reason: "Trip not found" };
    const booking = this.bookings.find(
      (b) => b.id === bookingId && b.tripId === tripId
    );
    if (!booking) return { success: false, reason: "Booking not found" };
    if (
      booking.bookingStatus === "cancelled" ||
      booking.bookingStatus === "refunded"
    ) {
      return { success: false, reason: "Booking not active" };
    }
    booking.checkedIn = true;
    booking.updatedAt = new Date().toISOString();
    this.logAudit("checked_in", "Booking", bookingId, { tripId });
    this.persistToGlobal();
    return { success: true };
  }

  // New Enhanced Trip Management Methods
  createTrip(
    tripData: TripFormData,
    parkId: string
  ): { success: boolean; trips?: Trip[]; error?: string } {
    try {
      // Validate seat count (max 50 seats as per business rules)
      if (tripData.seatCount > 50) {
        return {
          success: false,
          error: `Seat count (${tripData.seatCount}) cannot exceed 50 seats`,
        };
      }

      const createdTrips: Trip[] = [];

      if (tripData.isRecurring && tripData.recurrencePattern) {
        // Create recurring trips
        const trips = this.generateRecurringTrips(tripData, parkId);
        createdTrips.push(...trips);
      } else {
        // Create single trip
        const trip = this.createSingleTrip(tripData, parkId);
        createdTrips.push(trip);
      }

      // Log audit for trip creation
      createdTrips.forEach((trip) => {
        this.logAudit("trip_created", "Trip", trip.id, {
          tripData: {
            routeId: trip.routeId,
            date: trip.date,
            unitTime: trip.unitTime,
            seatCount: trip.seatCount,
            price: trip.price,
            isRecurring: trip.isRecurring,
          },
        });
      });

      this.persistToGlobal();
      return { success: true, trips: createdTrips };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private createSingleTrip(tripData: TripFormData, parkId: string): Trip {
    const trip: Trip = {
      id: `trip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      parkId,
      routeId: tripData.routeId,
      date: tripData.date,
      unitTime: tripData.unitTime,
      seatCount: tripData.seatCount,
      confirmedBookingsCount: 0,
      maxParcelsPerVehicle: tripData.maxParcelsPerVehicle,
      driverId: tripData.driverId,
      driverPhone: tripData.driverPhone,
      price: tripData.price,
      status: tripData.status,
      payoutStatus: "NotScheduled",
      isRecurring: tripData.isRecurring,
      recurrencePattern: tripData.recurrencePattern,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.trips.push(trip);
    return trip;
  }

  private generateRecurringTrips(
    tripData: TripFormData,
    parkId: string
  ): Trip[] {
    const trips: Trip[] = [];
    const startDate = new Date(tripData.date);
    const endDate = tripData.recurrencePattern?.endDate
      ? new Date(tripData.recurrencePattern.endDate)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

    const parentTripId = `parent_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate && trips.length < 365) {
      // Safety limit
      const dateStr = currentDate.toISOString().split("T")[0];

      // Check if this date should be excluded
      if (tripData.recurrencePattern?.exceptions?.includes(dateStr)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Check if this date matches the recurrence pattern
      if (this.shouldIncludeDate(currentDate, tripData.recurrencePattern!)) {
        const trip: Trip = {
          id: `trip_${dateStr}_${tripData.routeId}_${Date.now()}`,
          parkId,
          routeId: tripData.routeId,
          date: dateStr,
          unitTime: tripData.unitTime,
          seatCount: tripData.seatCount,
          confirmedBookingsCount: 0,
          maxParcelsPerVehicle: tripData.maxParcelsPerVehicle,
          driverId: tripData.driverId,
          driverPhone: tripData.driverPhone,
          price: tripData.price,
          status: tripData.status,
          payoutStatus: "NotScheduled",
          isRecurring: true,
          recurrencePattern: tripData.recurrencePattern,
          parentTripId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        this.trips.push(trip);
        trips.push(trip);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trips;
  }

  private shouldIncludeDate(date: Date, pattern: RecurrencePattern): boolean {
    const dayOfWeek = date.getDay();

    switch (pattern.type) {
      case "daily":
        return true;
      case "weekdays":
        return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
      case "custom":
        return pattern.daysOfWeek?.includes(dayOfWeek) || false;
      default:
        return false;
    }
  }

  publishTrip(tripId: string): { success: boolean; error?: string } {
    const trip = this.getTrip(tripId);
    if (!trip) {
      return { success: false, error: "Trip not found" };
    }

    if (trip.status === "published") {
      return { success: false, error: "Trip is already published" };
    }

    trip.status = "published";
    trip.updatedAt = new Date().toISOString();

    this.logAudit("trip_published", "Trip", tripId, {});
    this.persistToGlobal();

    return { success: true };
  }

  updateTrip(
    tripId: string,
    updates: Partial<TripFormData>,
    applyTo: "occurrence" | "future" | "series" = "occurrence"
  ): { success: boolean; error?: string } {
    const trip = this.getTrip(tripId);
    if (!trip) {
      return { success: false, error: "Trip not found" };
    }

    // Validate seat count if being updated
    if (updates.seatCount !== undefined) {
      // Vehicle information is now managed offline by Park admin

      if (updates.seatCount > 50) {
        return {
          success: false,
          error: `Seat count (${updates.seatCount}) cannot exceed 50 seats`,
        };
      }

      // Check if reducing seats below confirmed bookings
      if (updates.seatCount < trip.confirmedBookingsCount) {
        return {
          success: false,
          error: `Cannot reduce seats to ${updates.seatCount} as there are ${trip.confirmedBookingsCount} confirmed bookings`,
        };
      }
    }

    // Validate price changes
    if (updates.price !== undefined && updates.price !== trip.price) {
      if (trip.confirmedBookingsCount > 0) {
        return {
          success: false,
          error: `Cannot change price as there are ${trip.confirmedBookingsCount} confirmed bookings. New price will apply to future bookings only.`,
        };
      }
    }

    // Apply updates
    Object.assign(trip, updates);
    trip.updatedAt = new Date().toISOString();

    // If this is part of a recurring series, apply to related trips based on applyTo
    if (trip.isRecurring && trip.parentTripId) {
      this.updateRecurringSeries(
        trip.parentTripId,
        updates,
        applyTo,
        trip.date
      );
    }

    this.logAudit("trip_updated", "Trip", tripId, { updates, applyTo });
    this.persistToGlobal();

    return { success: true };
  }

  private updateRecurringSeries(
    parentTripId: string,
    updates: Partial<TripFormData>,
    applyTo: "occurrence" | "future" | "series",
    currentTripDate: string
  ): void {
    const relatedTrips = this.trips.filter(
      (t) => t.parentTripId === parentTripId
    );

    relatedTrips.forEach((trip) => {
      let shouldUpdate = false;

      switch (applyTo) {
        case "series":
          shouldUpdate = true;
          break;
        case "future":
          shouldUpdate = trip.date > currentTripDate;
          break;
        case "occurrence":
        default:
          shouldUpdate = trip.date === currentTripDate;
          break;
      }

      if (shouldUpdate) {
        Object.assign(trip, updates);
        trip.updatedAt = new Date().toISOString();
        this.logAudit("trip_updated", "Trip", trip.id, { updates, applyTo });
      }
    });
  }

  // Enhanced booking with atomic seat allocation
  createBookingWithHold(
    tripId: string,
    bookingData: Omit<
      Booking,
      "id" | "tripId" | "createdAt" | "updatedAt" | "seatNumber"
    >,
    holdDurationMinutes = 5
  ): {
    success: boolean;
    booking?: Booking;
    holdToken?: string;
    error?: string;
    conflictType?: string;
  } {
    const trip = this.getTrip(tripId);
    if (!trip) {
      return { success: false, error: "Trip not found" };
    }

    // Check if trip is published/live
    if (trip.status !== "published" && trip.status !== "live") {
      return { success: false, error: "Trip is not available for booking" };
    }

    // Check if seats are available
    if (trip.confirmedBookingsCount >= trip.seatCount) {
      return {
        success: false,
        error: "No seats available",
        conflictType: "SLOT_TAKEN",
      };
    }

    // Generate hold token
    const holdToken = `hold_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    const holdExpiresAt = Date.now() + holdDurationMinutes * 60 * 1000;

    // Create pending booking with hold
    const booking: Booking = {
      id: `booking_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      tripId,
      ...bookingData,
      seatNumber: trip.confirmedBookingsCount + 1,
      paymentStatus: "pending",
      bookingStatus: "pending",
      paymentHoldExpiresAt: holdExpiresAt,
      holdToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.bookings.push(booking);
    trip.confirmedBookingsCount++; // Reserve the seat
    trip.updatedAt = new Date().toISOString();

    // Set timer to release seat if payment not confirmed
    const timer = setTimeout(() => {
      this.releaseSeatHold(booking.id);
    }, holdDurationMinutes * 60 * 1000);

    this.seatHoldTimers.set(booking.id, timer);

    this.logAudit("booking_created_with_hold", "Booking", booking.id, {
      tripId,
      holdToken,
      holdExpiresAt,
    });
    this.persistToGlobal();

    return { success: true, booking, holdToken };
  }

  confirmBookingPayment(bookingId: string): {
    success: boolean;
    error?: string;
  } {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    // Check if hold is still valid
    if (
      booking.paymentHoldExpiresAt &&
      Date.now() > booking.paymentHoldExpiresAt
    ) {
      return { success: false, error: "Payment hold has expired" };
    }

    // Confirm the booking
    booking.paymentStatus = "confirmed";
    booking.bookingStatus = "confirmed";
    booking.updatedAt = new Date().toISOString();

    // Clear the hold timer
    const timer = this.seatHoldTimers.get(bookingId);
    if (timer) {
      clearTimeout(timer);
      this.seatHoldTimers.delete(bookingId);
    }

    this.logAudit("booking_confirmed", "Booking", bookingId, {});
    this.persistToGlobal();

    return { success: true };
  }

  private releaseSeatHold(bookingId: string): void {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    // Remove the booking
    const bookingIndex = this.bookings.findIndex((b) => b.id === bookingId);
    if (bookingIndex > -1) {
      this.bookings.splice(bookingIndex, 1);
    }

    // Release the seat
    const trip = this.getTrip(booking.tripId);
    if (trip) {
      trip.confirmedBookingsCount--;
      trip.updatedAt = new Date().toISOString();
    }

    // Clear timer
    const timer = this.seatHoldTimers.get(bookingId);
    if (timer) {
      clearTimeout(timer);
      this.seatHoldTimers.delete(bookingId);
    }

    this.logAudit("seat_hold_released", "Booking", bookingId, {});
    this.persistToGlobal();
  }

  // Driver assignment with conflict detection
  assignDriverWithConflictCheck(
    tripId: string,
    driverId: string
  ): { success: boolean; conflictTripId?: string; error?: string } {
    const trip = this.getTrip(tripId);
    if (!trip) {
      return { success: false, error: "Trip not found" };
    }

    // Check for driver conflicts (same day, different trip)
    const conflictingTrips = this.trips.filter(
      (t) =>
        t.driverId === driverId &&
        t.date === trip.date &&
        t.id !== tripId &&
        (t.status === "published" || t.status === "live")
    );

    if (conflictingTrips.length > 0) {
      return {
        success: false,
        conflictTripId: conflictingTrips[0].id,
        error: "Driver has conflicting assignment",
      };
    }

    trip.driverId = driverId;
    trip.updatedAt = new Date().toISOString();

    this.logAudit("driver_assigned", "Trip", tripId, { driverId });
    this.persistToGlobal();

    return { success: true };
  }

  // Get trips with park metadata for public API
  getTripsWithParkMetadata(
    parkId: string,
    date?: string
  ): Array<
    Trip & {
      park?: { name: string; address: string; lat?: number; lon?: number };
    }
  > {
    const trips = this.getTrips(parkId, date);

    // Mock park metadata - in real app this would come from parks store
    const parkMetadata = {
      name: "Lekki Phase 1 Motor Park",
      address: "Lekki Phase 1, Lagos, Nigeria",
      lat: 6.4698,
      lon: 3.5852,
    };

    return trips.map((trip) => ({
      ...trip,
      park: parkMetadata,
    }));
  }
}

// Export singleton instance
export const tripsStore = new TripsStore();
