// Live Bookings Data Store and Simulation
// Easy migration to database later

export interface LiveBooking {
  id: string;
  routeScheduleId: string;
  parkId: string;
  destination: string;
  passenger: {
    name: string;
    phone: string;
    address: string;
    nextOfKin: {
      name: string;
      phone: string;
      address: string;
      relationship: string;
    };
  };
  slotNumbers: number[];
  totalAmount: number;
  baseAmount: number;
  systemServiceCharge: 500;
  status: "RESERVED" | "CONFIRMED" | "EXPIRED" | "CANCELLED" | "COMPLETED";
  reservedAt: number;
  expiresAt?: number;
  confirmedAt?: number;
  completedAt?: number;
  paymentReference?: string;
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // Always "06:00"
  createdAt: number;
  updatedAt: number;
}

// Nigerian passenger data for realistic simulation
const NIGERIAN_NAMES = [
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
  "Suleiman Bello",
  "Grace Okonkwo",
  "Aliyu Sambo",
  "Folake Williams",
];

const LAGOS_ADDRESSES = [
  "15 Victoria Island, Lagos",
  "Block 12, Lekki Phase 1, Lagos",
  "45 Allen Avenue, Ikeja, Lagos",
  "23 Surulere Street, Surulere, Lagos",
  "8 Maryland Mall Road, Maryland, Lagos",
  "67 Ikoyi Crescent, Ikoyi, Lagos",
  "34 Agege Motor Road, Agege, Lagos",
  "19 Oshodi-Apapa Expressway, Oshodi, Lagos",
  "52 Gbagada Express, Gbagada, Lagos",
  "28 Festac Town, Amuwo Odofin, Lagos",
];

const RELATIONSHIPS = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Friend",
  "Cousin",
];

// Route distribution based on popularity
const ROUTE_DISTRIBUTION = {
  Ibadan: 0.4,
  Abuja: 0.25,
  "Port Harcourt": 0.15,
  Kano: 0.1,
  Enugu: 0.1,
};

// Slot booking patterns
const SLOT_PATTERNS = [
  { slots: 1, probability: 0.6 },
  { slots: 2, probability: 0.25 },
  { slots: 3, probability: 0.08 },
  { slots: 4, probability: 0.04 },
  { slots: 5, probability: 0.02 },
  { slots: 6, probability: 0.01 },
];

// In-memory store (easy database migration)
class LiveBookingsStore {
  private bookings: Map<string, LiveBooking> = new Map();
  private bookingsByPark: Map<string, Set<string>> = new Map();
  private bookingsByStatus: Map<string, Set<string>> = new Map();
  private bookingsByDate: Map<string, Set<string>> = new Map();
  private lastModified: number = Date.now();

  // Add booking and update indices
  addBooking(booking: LiveBooking) {
    this.bookings.set(booking.id, booking);
    this.updateIndices(booking);
    this.lastModified = Date.now();
  }

  // Update booking status
  updateBookingStatus(
    bookingId: string,
    status: LiveBooking["status"],
    additionalData?: Partial<LiveBooking>
  ) {
    const booking = this.bookings.get(bookingId);
    if (!booking) return null;

    // Remove from old status index
    const oldStatusSet = this.bookingsByStatus.get(booking.status);
    oldStatusSet?.delete(bookingId);

    // Update booking
    const updatedBooking = {
      ...booking,
      status,
      updatedAt: Date.now(),
      ...additionalData,
    };

    this.bookings.set(bookingId, updatedBooking);
    this.updateIndices(updatedBooking);
    this.lastModified = Date.now();

    return updatedBooking;
  }

  // Get bookings with filters
  getBookings(
    filters: {
      parkId?: string;
      status?: string;
      date?: string;
      modifiedAfter?: number;
    } = {}
  ): LiveBooking[] {
    let bookingIds: Set<string>;

    // Apply most selective filter first
    if (filters.parkId) {
      bookingIds = this.bookingsByPark.get(filters.parkId) || new Set();
    } else if (filters.status) {
      bookingIds = this.bookingsByStatus.get(filters.status) || new Set();
    } else if (filters.date) {
      bookingIds = this.bookingsByDate.get(filters.date) || new Set();
    } else {
      bookingIds = new Set(this.bookings.keys());
    }

    // Filter and return bookings
    return Array.from(bookingIds)
      .map((id) => this.bookings.get(id)!)
      .filter((booking) => {
        if (filters.parkId && booking.parkId !== filters.parkId) return false;
        if (filters.status && booking.status !== filters.status) return false;
        if (filters.date && booking.departureDate !== filters.date)
          return false;
        if (filters.modifiedAfter && booking.updatedAt <= filters.modifiedAfter)
          return false;
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt); // Most recent first
  }

  // Get single booking
  getBooking(id: string): LiveBooking | null {
    return this.bookings.get(id) || null;
  }

  // Update indices for efficient querying
  private updateIndices(booking: LiveBooking) {
    // Park index
    if (!this.bookingsByPark.has(booking.parkId)) {
      this.bookingsByPark.set(booking.parkId, new Set());
    }
    this.bookingsByPark.get(booking.parkId)!.add(booking.id);

    // Status index
    if (!this.bookingsByStatus.has(booking.status)) {
      this.bookingsByStatus.set(booking.status, new Set());
    }
    this.bookingsByStatus.get(booking.status)!.add(booking.id);

    // Date index
    if (!this.bookingsByDate.has(booking.departureDate)) {
      this.bookingsByDate.set(booking.departureDate, new Set());
    }
    this.bookingsByDate.get(booking.departureDate)!.add(booking.id);
  }

  // Get last modified timestamp for smart polling
  getLastModified(): number {
    return this.lastModified;
  }

  // Get summary stats
  getStats(parkId?: string): {
    total: number;
    reserved: number;
    confirmed: number;
    expired: number;
    cancelled: number;
    completed: number;
    todayRevenue: number;
  } {
    const bookings = this.getBookings(parkId ? { parkId } : {});
    const today = new Date().toISOString().split("T")[0];

    const stats = {
      total: bookings.length,
      reserved: 0,
      confirmed: 0,
      expired: 0,
      cancelled: 0,
      completed: 0,
      todayRevenue: 0,
    };

    bookings.forEach((booking) => {
      stats[booking.status.toLowerCase() as keyof typeof stats]++;
      if (
        booking.departureDate === today &&
        (booking.status === "CONFIRMED" || booking.status === "COMPLETED")
      ) {
        stats.todayRevenue += booking.totalAmount;
      }
    });

    return stats;
  }
}

// Global store instance
export const liveBookingsStore = new LiveBookingsStore();

// Booking simulation utilities
export class BookingSimulator {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Simulate new bookings every 45-60 seconds
    this.intervalId = setInterval(() => {
      if (Math.random() < 0.7) {
        // 70% chance to generate booking
        this.generateRandomBooking();
      }
    }, 45000 + Math.random() * 15000); // 45-60 seconds

    // Process status updates every 10 seconds
    setInterval(() => {
      this.processStatusUpdates();
    }, 10000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  // Generate realistic random booking
  generateRandomBooking(): LiveBooking {
    const parks = ["lekki-phase-1-motor-park", "ikeja-motor-park"];
    const parkId = parks[Math.floor(Math.random() * parks.length)];

    // Select destination based on popularity
    const destination = this.selectWeightedDestination();

    // Select slot count based on patterns
    const slotCount = this.selectSlotCount();
    const slotNumbers = Array.from({ length: slotCount }, (_, i) => i + 1);

    // Generate passenger data
    const passenger = this.generatePassengerData();

    // Calculate pricing
    const basePrice = this.getBasePrice(destination);
    const totalAmount = basePrice * slotCount + 500;

    // Generate dates (tomorrow's trip)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const departureDate = tomorrow.toISOString().split("T")[0];

    const now = Date.now();
    const booking: LiveBooking = {
      id: `b_${Math.floor(now / 1000)}_${this.generateRandomId()}`,
      routeScheduleId: `${parkId}_${destination}_${departureDate}_06:00`,
      parkId,
      destination,
      passenger,
      slotNumbers,
      totalAmount,
      baseAmount: basePrice * slotCount,
      systemServiceCharge: 500,
      status: "RESERVED",
      reservedAt: now,
      expiresAt: now + 15 * 60 * 1000, // 15 minutes
      departureDate,
      departureTime: "06:00",
      createdAt: now,
      updatedAt: now,
    };

    liveBookingsStore.addBooking(booking);
    console.log(
      `🎯 Simulated booking: ${booking.passenger.name} → ${booking.destination} (${slotCount} slots)`
    );

    return booking;
  }

  // Process automatic status transitions
  private processStatusUpdates() {
    const reservedBookings = liveBookingsStore.getBookings({
      status: "RESERVED",
    });
    const now = Date.now();

    reservedBookings.forEach((booking) => {
      // Auto-expire after 15 minutes
      if (booking.expiresAt && now > booking.expiresAt) {
        liveBookingsStore.updateBookingStatus(booking.id, "EXPIRED");
        console.log(`⏰ Auto-expired booking: ${booking.id}`);
      }
      // Random payment confirmation (70% chance within timer)
      else if (Math.random() < 0.02) {
        // 2% chance per check = ~70% over 15 minutes
        liveBookingsStore.updateBookingStatus(booking.id, "CONFIRMED", {
          confirmedAt: now,
          paymentReference: `pay_${this.generateRandomId()}`,
        });
        console.log(`💳 Auto-confirmed booking: ${booking.id}`);
      }
    });

    // Auto-complete trips 2 hours after departure
    const confirmedBookings = liveBookingsStore.getBookings({
      status: "CONFIRMED",
    });
    confirmedBookings.forEach((booking) => {
      const departureTime = new Date(
        `${booking.departureDate}T06:00:00+01:00`
      ).getTime();
      const completionTime = departureTime + 2 * 60 * 60 * 1000; // 2 hours after departure

      if (now > completionTime) {
        liveBookingsStore.updateBookingStatus(booking.id, "COMPLETED", {
          completedAt: now,
        });
        console.log(`✅ Auto-completed booking: ${booking.id}`);
      }
    });
  }

  // Utility methods
  private selectWeightedDestination(): string {
    const random = Math.random();
    let cumulative = 0;

    for (const [destination, probability] of Object.entries(
      ROUTE_DISTRIBUTION
    )) {
      cumulative += probability;
      if (random <= cumulative) {
        return destination;
      }
    }
    return "Ibadan"; // Fallback
  }

  private selectSlotCount(): number {
    const random = Math.random();
    let cumulative = 0;

    for (const pattern of SLOT_PATTERNS) {
      cumulative += pattern.probability;
      if (random <= cumulative) {
        return pattern.slots;
      }
    }
    return 1; // Fallback
  }

  private generatePassengerData() {
    const name =
      NIGERIAN_NAMES[Math.floor(Math.random() * NIGERIAN_NAMES.length)];
    const address =
      LAGOS_ADDRESSES[Math.floor(Math.random() * LAGOS_ADDRESSES.length)];
    const nokName =
      NIGERIAN_NAMES[Math.floor(Math.random() * NIGERIAN_NAMES.length)];
    const nokAddress =
      LAGOS_ADDRESSES[Math.floor(Math.random() * LAGOS_ADDRESSES.length)];
    const relationship =
      RELATIONSHIPS[Math.floor(Math.random() * RELATIONSHIPS.length)];

    return {
      name,
      phone: `+234${Math.floor(Math.random() * 900000000) + 700000000}`, // Nigerian mobile
      address,
      nextOfKin: {
        name: nokName,
        phone: `+234${Math.floor(Math.random() * 900000000) + 700000000}`,
        address: nokAddress,
        relationship,
      },
    };
  }

  private getBasePrice(destination: string): number {
    const prices = {
      Ibadan: 4000,
      Abuja: 6000,
      "Port Harcourt": 5500,
      Kano: 7000,
      Enugu: 5000,
    };
    return prices[destination as keyof typeof prices] || 4000;
  }

  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 8);
  }

  // Manual simulation for testing
  generateTestBooking(
    parkId: string,
    destination: string,
    status: LiveBooking["status"] = "RESERVED"
  ): LiveBooking {
    const booking = this.generateRandomBooking();
    const updatedBooking = {
      ...booking,
      parkId,
      destination,
      status,
      routeScheduleId: `${parkId}_${destination}_${booking.departureDate}_06:00`,
    };

    liveBookingsStore.addBooking(updatedBooking);
    return updatedBooking;
  }
}

// Global simulator instance
export const bookingSimulator = new BookingSimulator();



