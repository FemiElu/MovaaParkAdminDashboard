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

export interface RouteConfig {
  id: string;
  parkId: string;
  destination: string;
  basePrice: number;
  vehicleCapacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  parkId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  qualifiedRoutes: string[];
  isActive: boolean;
  rating?: number;
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
export interface SlotBooking {
  id: string;
  routeScheduleId: string;
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
  userId?: string;
  slotNumbers: number[];
  status: "RESERVED" | "CONFIRMED" | "EXPIRED" | "CANCELLED";
  reservedAt: number;
  expiresAt?: number;
  cancellationDeadline?: number;
  paymentReference?: string;
  totalAmount?: number;
  parkShare?: number;
  driverShare?: number;
}

export interface RouteSchedule {
  id: string;
  parkId: string;
  destination: string;
  date: string;
  time: string;
  configuredSlotCount: number;
  confirmedBookingsCount: number;
  bookings: string[];
}

export interface AvailabilityInfo {
  configuredSlotCount: number;
  reservedCount: number;
  confirmedCount: number;
  slotsLeft: number;
  nextSlotNumber: number;
}

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
  passenger: SlotBooking["passenger"];
  destination: string;
  slotNumbers: number[];
  status: SlotBooking["status"];
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
export interface WebhookPayload {
  type:
    | "booking-created"
    | "booking-confirmed"
    | "booking-cancelled"
    | "payment-confirmed";
  data: SlotBooking;
  timestamp: number;
  parkId: string;
}

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
export interface RouteFormData {
  destination: string;
  basePrice: number;
  vehicleCapacity: number;
  isActive: boolean;
}

export interface DriverFormData {
  name: string;
  phone: string;
  licenseNumber: string;
  qualifiedRoutes: string[];
  isActive: boolean;
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
