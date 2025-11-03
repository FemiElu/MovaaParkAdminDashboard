/**
 * Booking API Service Layer
 * Handles communication with backend booking APIs
 */

import type { Booking } from "@/types";

export interface BackendBooking {
  id: string;
  trip: {
    id: string;
    from_state: string;
    to_route: {
      id: string;
      from_state: string;
      to_state: string;
      to_city: string;
      bus_stop: string;
      terminal?: string;
    };
    departure_date: string;
    departure_time: string;
    bus_terminal: {
      id: string;
      name: string;
      address: string;
      city: string;
      state: string;
      location: string; // Was object, actually string in API
    };
    total_seats: number;
    is_full: boolean;
    is_active: boolean;
    is_completed: boolean;
    is_cancelled: boolean;
    available_seats: number;
    price: number;
    created_at: string;
  };
  user: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    address?: string | null;
    is_email_generated?: boolean;
    avatar?: string;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    user_type: string[];
    is_active: boolean;
    next_of_kin: Array<{
      full_name: string;
      phone_number: string;
      address?: string;
      is_default?: boolean;
    }>;
  };
  qr_code: string;
  created_at: string;
  updated_at: string;
  booking_id: string;
  booking_for: string;
  slot: number;
  price: number;
  seat_number: string;
  payment_status: string;
  is_paid: boolean;
  is_cancelled: boolean;
  is_checked_in: boolean;
  created_by?: string;
  updated_by?: string;
  deleted_by?: string | null;
  bus_terminal: string;
}

export interface BookingListResponse {
  success: boolean;
  data: BackendBooking[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}

export interface BookingResponse {
  success: boolean;
  data: BackendBooking | null;
  message?: string;
  error?: string;
}

export interface CheckInResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

class BookingApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1/api/v1";
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit & { token?: string } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Debug logging
    console.log(`Making booking API request to: ${url}`);
    console.log(`Request options:`, options);

    const defaultHeaders: Record<string, string> = {};

    // Only set Content-Type for JSON requests (not FormData)
    if (!(options.body instanceof FormData)) {
      defaultHeaders["Content-Type"] = "application/json";
    }

    // Add authorization header if we have a token
    const token =
      options.token ||
      (typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null);
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
      console.log(
        "Booking API - Authorization header:",
        `Bearer ${token.substring(0, 20)}...`
      );
    } else {
      console.log("Booking API - No auth token found");
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        // Check if response is HTML (error page) instead of JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          console.error("Backend returned HTML error page instead of JSON:", {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            contentType: contentType,
          });
          throw new Error(
            `Backend error: Server returned HTML page (${response.status} ${response.statusText}). This is likely a backend server issue.`
          );
        }

        const errorData = await response.json().catch(() => ({}));

        // Handle specific error cases
        if (response.status === 404) {
          console.warn(`Resource not found: ${url}`);
          return {
            success: false,
            data: [],
            error: errorData.message || "Resource not found",
            statusCode: 404,
          } as T;
        }

        if (response.status === 401) {
          console.warn(`Unauthorized: ${url}`);
          return {
            success: false,
            data: [],
            error: "Authentication required",
            statusCode: 401,
          } as T;
        }

        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      // Transform backend response format to expected frontend format
      // Backend returns: {message: 'Success', data: Array(0), errors: null}
      // Frontend expects: {success: true, data: [...]}
      if (data.message === "Success") {
        return {
          success: true,
          data: data.data || [],
          message: data.message,
          errors: data.errors,
        } as T;
      }

      return data;
    } catch (error) {
      console.error(`Booking API request failed for ${endpoint}:`, error);
      console.error(`Full URL attempted: ${url}`);
      throw error;
    }
  }

  /**
   * Get all bookings for a specific trip
   */
  async getTripBookings(
    tripId: string,
    token?: string
  ): Promise<BookingListResponse> {
    try {
      const raw = await this.makeRequest<unknown>(
        `/admin-booking/list-booking/${tripId}/`,
        {
          method: "GET",
          token: token,
        }
      );
      // Type guard for expected response shape
      let bookingsArr: BackendBooking[] = [];
      let success = false;
      if (
        raw && typeof raw === "object" &&
        "data" in raw && Array.isArray((raw as { data: unknown }).data)
      ) {
        bookingsArr = (raw as { data: BackendBooking[] }).data;
        success = true;
      } else if (
        raw && typeof raw === "object" &&
        "data" in raw && typeof (raw as { data: unknown }).data === "object" &&
        Array.isArray((raw as { data: { data: BackendBooking[] } }).data.data)
      ) {
        bookingsArr = (raw as { data: { data: BackendBooking[] } }).data.data;
        success = true;
      }
      return {
        ...(typeof raw === "object" ? raw : {}),
        data: bookingsArr,
        success,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch trip bookings",
      };
    }
  }

  /**
   * Get a specific booking by ID
   */
  async getBooking(
    bookingId: string,
    token?: string
  ): Promise<BookingResponse> {
    try {
      const response = await this.makeRequest<BookingResponse>(
        `/admin-booking/get-booking/${bookingId}/`,
        {
          method: "GET",
          token: token,
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        data: null,
        error:
          error instanceof Error ? error.message : "Failed to fetch booking",
      };
    }
  }

  /**
   * Check in a booking
   */
  async checkInBooking(
    bookingId: string,
    token?: string
  ): Promise<CheckInResponse> {
    try {
      const response = await this.makeRequest<CheckInResponse>(
        `/admin-booking/check-in/${bookingId}/`,
        {
          method: "POST",
          token: token,
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to check in booking",
      };
    }
  }

  /**
   * Get ALL bookings for this park admin (flat list, not trip-centric).
   */
  async getAllBookings(token?: string): Promise<BookingListResponse> {
    try {
      const response = await this.makeRequest<BookingListResponse>(
        "/booking/",
        {
          method: "GET",
          token: token,
        }
      );
      // Normalize API response
      if (response && Array.isArray(response.data)) {
        return {
          ...response,
          success: true,
          data: response.data,
        };
      }
      if (
        response && typeof response === "object" &&
        "message" in response && (response as { message: string }).message === "Success" &&
        "data" in response && Array.isArray((response as { data: unknown }).data)
      ) {
        return {
          success: true,
          data: (response as { data: BackendBooking[] }).data,
        };
      }
      return {
        ...response,
        success: false,
        data: [],
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error:
          error instanceof Error ? error.message : "Failed to fetch bookings",
      };
    }
  }

  /**
   * Convert backend booking format to frontend format
   */
  convertBackendBookingToFrontend(backendBooking: BackendBooking): Booking {
    const kin = backendBooking.user.next_of_kin?.[0];
    return {
      id: backendBooking.id,
      tripId: backendBooking.trip.id,
      passengerName: `${backendBooking.user.first_name} ${backendBooking.user.last_name}`,
      passengerPhone: backendBooking.user.phone_number,
      nokName: kin?.full_name || "",
      nokPhone: kin?.phone_number || "",
      nokAddress: `${backendBooking.user.address ?? ""}`,
      seatNumber:
        Number.parseInt(
          (backendBooking.seat_number || "").replace(/\D/g, "")
        ) || backendBooking.slot,
      amountPaid: backendBooking.price,
      paymentStatus: backendBooking.payment_status as
        | "pending"
        | "confirmed"
        | "refunded",
      bookingStatus: backendBooking.is_cancelled
        ? "cancelled"
        : ("confirmed" as "pending" | "confirmed" | "cancelled" | "refunded"),
      isCheckedIn: backendBooking.is_checked_in,
      qrCode: backendBooking.qr_code,
      bookingId: backendBooking.booking_id,
      createdAt: backendBooking.created_at,
      updatedAt: backendBooking.updated_at,
      trip: {
        id: backendBooking.trip.id,
        fromState: backendBooking.trip.from_state,
        toRoute: {
          id: backendBooking.trip.to_route.id,
          fromState: backendBooking.trip.to_route.from_state,
          toState: backendBooking.trip.to_route.to_state,
          toCity: backendBooking.trip.to_route.to_city,
          busStop: backendBooking.trip.to_route.bus_stop,
          terminal: backendBooking.trip.to_route.terminal ?? "",
        },
        departureDate: backendBooking.trip.departure_date,
        departureTime: backendBooking.trip.departure_time,
        busTerminal: {
          id: backendBooking.trip.bus_terminal.id,
          name: backendBooking.trip.bus_terminal.name,
          address: backendBooking.trip.bus_terminal.address,
          city: backendBooking.trip.bus_terminal.city,
          state: backendBooking.trip.bus_terminal.state,
          location:
            typeof backendBooking.trip.bus_terminal.location === "object"
              ? backendBooking.trip.bus_terminal.location
              : { latitude: 0, longitude: 0 },
        },
        totalSeats: backendBooking.trip.total_seats,
        isFull: backendBooking.trip.is_full,
        isActive: backendBooking.trip.is_active,
        isCompleted: backendBooking.trip.is_completed,
        isCancelled: backendBooking.trip.is_cancelled,
        availableSeats: backendBooking.trip.available_seats,
        price: backendBooking.trip.price,
        createdAt: backendBooking.trip.created_at,
      },
      user: {
        ...backendBooking.user,
        address: backendBooking.user.address ?? "",
        is_email_generated: backendBooking.user.is_email_generated ?? false,
        avatar: backendBooking.user.avatar ?? "",
        city: backendBooking.user.city ?? "",
        state: backendBooking.user.state ?? "",
        country: backendBooking.user.country ?? "",
        user_type: Array.isArray(backendBooking.user.user_type)
          ? backendBooking.user.user_type.join(", ")
          : backendBooking.user.user_type ?? "",
        next_of_kin: Array.isArray(backendBooking.user.next_of_kin)
          ? backendBooking.user.next_of_kin.map(k => k.full_name).join(", ")
          : backendBooking.user.next_of_kin ?? "",
      },
    };
  }
}

// Export singleton instance
export const bookingApiService = new BookingApiService();
