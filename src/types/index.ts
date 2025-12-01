// Core business models matching passenger app
export interface Park {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lon?: number;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Backend API Route structure
export interface BackendRoute {
  id: string;
  from_state: string | null;
  to_state: string;
  to_city: string | null;
  bus_stop: string | null;
  terminal: string;
}

// Frontend Route structure (for backward compatibility and UI)
export interface RouteConfig {
  id: string;
  parkId: string;
  destination: string;
  destinationPark?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Route form data for creating/updating routes
export interface RouteFormData {
  destination: string;
  destinationPark?: string;
  from_state: string;
  isActive: boolean;
}

// Backend route creation data
export interface BackendRouteCreateData {
  from_state: string;
  to_state: string;
  to_city: string;
  bus_stop: string;
}

export interface Driver {
  id: string;
  parkId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry?: string;
  qualifiedRoute: string; // Single route destination (e.g., "Ibadan")
  routeIds?: string[]; // Array of route IDs the driver is assigned to
  isActive: boolean;
  rating?: number;
  vehiclePlateNumber?: string;
  address?: string;
  photo?: string;
  documents?: {
    type: "DRIVER_LICENSE" | "OTHER";
    number?: string;
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface TripAssignment {
  id: string;
  parkId: string;
  routeId: string;
  driverId: string;
  tripDate: string;
  vehicleCapacity: number;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  assignedAt: string;
  updatedAt: string;
  route?: RouteConfig;
  driver?: Driver;
}

export interface RevenueSharing {
  id: string;
  parkId: string;
  routeId: string;
  driverPercentage: number;
  parkPercentage: number;
}

// Passenger app data models (received via webhooks)
// REMOVED: SlotBooking, RouteSchedule, AvailabilityInfo interfaces were removed as part of webhook feature removal

// Dashboard data structures
export interface DashboardStats {
  todayBookings: number;
  todayRevenue: number;
  activeRoutes: number;
  totalDrivers: number;
  weeklyBookings: number[];
  weeklyRevenue: number[];
  topRoutes: {
    destination: string;
    bookings: number;
    revenue: number;
  }[];
}

export interface LiveBooking {
  id: string;
  passenger: {
    name: string;
    phone: string;
    address: string;
    nextOfKin?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  destination: string;
  slotNumbers: number[];
  status: "RESERVED" | "CONFIRMED" | "EXPIRED" | "CANCELLED";
  reservedAt: number;
  expiresAt?: number;
  totalAmount?: number;
  paymentReference?: string;
}

// Notification types
export interface Notification {
  id: string;
  parkId: string;
  title: string;
  message: string;
  type:
  | "BOOKING_CREATED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "PAYMENT_RECEIVED"
  | "CAPACITY_ALERT"
  | "DRIVER_ASSIGNMENT"
  | "SYSTEM_ALERT";
  isRead: boolean;
  createdAt: string;
  bookingData?: Record<string, unknown>;
}

// Webhook payload types
// REMOVED: WebhookPayload interface was removed as part of webhook feature removal

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form validation types

export interface DriverFormData {
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry?: string;
  qualifiedRoute: string; // Single route destination
  isActive: boolean;
  rating?: number;
  vehiclePlateNumber?: string;
  address?: string;
  photo?: string;
}

export interface TripAssignmentFormData {
  routeId: string;
  driverId: string;
  tripDate: string;
  vehicleCapacity: number;
}

// User management types
export interface ParkAdmin {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "PARK_ADMIN" | "PARK_STAFF";
  parkId?: string;
  isActive: boolean;
  createdAt: string;
  park?: Park;
}

// Configuration types
export interface SystemConfig {
  serviceCharge: number;
  holdDurationMinutes: number;
  cancellationWindowHours: number;
  maxSlotsPerBooking: number;
  defaultDepartureTime: string;
}

// Enhanced Trip Types for New Requirements
export interface Trip {
  id: string;
  parkId: string;
  routeId: string;
  date: string; // YYYY-MM-DD
  unitTime: string; // HH:MM format
  seatCount: number;
  confirmedBookingsCount: number;
  maxParcelsPerVehicle: number;
  driverId?: string;
  driverPhone?: string;
  price: number;
  status: "draft" | "published" | "live" | "completed" | "cancelled";
  payoutStatus: "NotScheduled" | "Scheduled" | "Paid";
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  parentTripId?: string; // For recurring trip instances
  createdAt: string;
  updatedAt: string;
}

export interface RecurrencePattern {
  type: "daily" | "weekdays" | "custom";
  interval?: number; // For custom patterns
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  endDate?: string; // Optional end date for recurring trips
  exceptions?: string[]; // Array of dates to exclude (YYYY-MM-DD)
}

export interface Booking {
  id: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  nokName: string;
  nokPhone: string;
  nokAddress: string;
  seatNumber: number;
  amountPaid: number;
  paymentStatus: "pending" | "confirmed" | "refunded";
  bookingStatus: "pending" | "confirmed" | "cancelled" | "refunded";
  checkedIn?: boolean;
  isCheckedIn?: boolean;
  paymentHoldExpiresAt?: number; // timestamp for 5-minute hold
  holdToken?: string; // Unique token for seat hold
  qrCode?: string;
  bookingId?: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields from backend
  trip?: {
    id: string;
    fromState: string;
    toRoute: {
      id: string;
      fromState: string;
      toState: string;
      toCity: string;
      busStop: string;
      terminal: string;
    };
    departureDate: string;
    departureTime: string;
    busTerminal: {
      id: string;
      name: string;
      address: string;
      city: string;
      state: string;
      location: {
        latitude: number;
        longitude: number;
      };
    };
    totalSeats: number;
    isFull: boolean;
    isActive: boolean;
    isCompleted: boolean;
    isCancelled: boolean;
    availableSeats: number;
    price: number;
    createdAt: string;
  };
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    address: string;
    is_email_generated: boolean;
    avatar: string;
    city: string;
    state: string;
    country: string;
    user_type: string;
    is_active: boolean;
    next_of_kin: string;
  };
}

export interface Vehicle {
  id: string;
  name: string;
  seatCount: number;
  maxParcelsPerVehicle: number;
  parkId: string;
}

// Form Types
export interface TripFormData {
  routeId: string;
  date: string;
  unitTime: string;
  seatCount: number;
  price: number;
  driverId?: string;
  driverPhone?: string;
  maxParcelsPerVehicle: number;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  status: "draft" | "published";
}

// API Response Types
export interface TripCreateResponse {
  success: boolean;
  data?: {
    trip?: Trip;
    trips?: Trip[]; // For recurring trips
  };
  error?: string;
  message?: string;
}

export interface BookingCreateResponse {
  success: boolean;
  data?: {
    booking?: Booking;
    holdToken?: string;
  };
  error?: string;
  message?: string;
  conflictType?: "SLOT_TAKEN" | "DRIVER_CONFLICT";
  conflictingTripId?: string;
}

// Notification Types
export interface NotificationTemplate {
  type:
  | "TripPublished"
  | "BookingConfirmed"
  | "BookingFailed"
  | "DriverAssigned"
  | "DriverDetailsAvailable";
  title: string;
  message: string;
  template: string;
}
