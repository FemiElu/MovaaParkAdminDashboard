/**
 * Trip API Service Layer
 * Handles communication with backend trip APIs
 */

export interface TripCreateData {
  total_seats: number;
  to_route: string;
  is_recurrent: boolean;
  from_state: string;
  departure_date: string; // Format: "2025-10-14"
  departure_time: string;
  price: string; // API expects string
}

export interface MinimalRoute {
  id: string;
  from_state: string;
  to_state: string;
  to_city: string;
  bus_stop: string;
}

export interface User {
  id: string;
  name: string;
  role: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BusTerminal {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
}

export interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  license_number: string;
  rating: number;
  rating_count: number;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  features: string[];
}

export interface Passenger {
  id: string;
  name: string;
  phone: string;
  seat_number: number;
  ticket_reference: string;
  is_paid: boolean;
  boarding_status: string;
}

export interface Trip {
  id: string;
  to_route: MinimalRoute;
  is_recurrent: boolean;
  created_at: string;
  updated_at: string;
  from_state: string;
  departure_date: string;
  departure_time: string;
  price: number;
  is_active: boolean;
  is_cancelled: boolean;
  is_completed: boolean;
  is_full: boolean;
  is_paid: boolean;
  total_seats: number;
  available_seats: number;
  driver_rating: number;
  driver_rating_count: number;
  driver_comment: string | null;
  trip_rating: number;
  trip_rating_count: number;
  trip_comment: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  bus_terminal: string;
  driver: string | null;
  vehicle: string | null;
  passengers: string[];
}

export interface TripListResponse {
  success: boolean;
  data: Trip[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface TripResponse {
  success: boolean;
  data: Trip;
  message?: string;
  error?: string;
}

export interface TripCustomersResponse {
  success: boolean;
  data: Passenger[];
  error?: string;
}

export interface TripDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

class TripApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1/api/v1";
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Debug logging
    console.log(`Making trip API request to: ${url}`);
    console.log(`Request options:`, options);

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authorization header if we have a token
    const token = localStorage.getItem("auth_token");
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
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
      const data = await response.json();

      console.log(`API Response for ${endpoint}:`, data);

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

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

      // Handle paginated list responses: { count, total_pages?, current_page?, data: [...] }
      if (
        typeof data === "object" &&
        data !== null &&
        Array.isArray((data as { data?: unknown[] }).data) &&
        (typeof (data as { count?: number; current_page?: number }).count ===
          "number" ||
          typeof (data as { current_page?: number }).current_page !==
            "undefined")
      ) {
        const paginated = data as {
          data: Trip[];
          count?: number;
          current_page?: number;
          limit?: number;
        };
        return {
          success: true,
          data: paginated.data,
          total: paginated.count,
          page: paginated.current_page,
          limit: paginated.limit,
        } as T;
      }

      // Handle direct array under data without message
      if (
        typeof data === "object" &&
        data !== null &&
        Array.isArray((data as { data?: unknown[] }).data)
      ) {
        return {
          success: true,
          data: (data as { data: Trip[] }).data,
        } as T;
      }

      // Handle direct data response (for single trip details)
      if (data.id && data.to_route) {
        return {
          success: true,
          data: data,
          message: "Success",
        } as T;
      }

      // Handle response where trip data is in message field
      if (
        data.message &&
        typeof data.message === "object" &&
        data.message.id &&
        data.message.to_route
      ) {
        const transformedResponse = {
          success: true,
          data: data.message,
          message: "Success",
        };
        console.log(
          `Transformed response for ${endpoint}:`,
          transformedResponse
        );
        return transformedResponse as T;
      }

      console.log(`Returning raw data for ${endpoint}:`, data);
      return data as T;
    } catch (error) {
      console.error(`Trip API request failed for ${endpoint}:`, error);
      console.error(`Full URL attempted: ${url}`);
      throw error;
    }
  }

  /**
   * Get all trips
   */
  async getAllTrips(): Promise<TripListResponse> {
    try {
      const response = await this.makeRequest<TripListResponse>(
        "/admin-trip/",
        {
          method: "GET",
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Failed to fetch trips",
      } as TripListResponse;
    }
  }

  /**
   * Create a new trip
   */
  async createTrip(tripData: TripCreateData): Promise<TripResponse> {
    try {
      const response = await this.makeRequest<TripResponse>("/admin-trip/", {
        method: "POST",
        body: JSON.stringify(tripData),
      });

      return response;
    } catch (error) {
      return {
        success: false,
        data: {} as Trip,
        error: error instanceof Error ? error.message : "Trip creation failed",
      };
    }
  }

  /**
   * Get trip by ID
   */
  async getTrip(id: string): Promise<TripResponse> {
    try {
      const response = await this.makeRequest<TripResponse>(
        `/admin-trip/${id}/`,
        {
          method: "GET",
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        data: {} as Trip,
        error: error instanceof Error ? error.message : "Failed to fetch trip",
      };
    }
  }

  /**
   * Update trip by ID
   */
  async updateTrip(
    id: string,
    tripData: Partial<TripCreateData>
  ): Promise<TripResponse> {
    try {
      const response = await this.makeRequest<TripResponse>(
        `/admin-trip/${id}/`,
        {
          method: "PUT",
          body: JSON.stringify(tripData),
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        data: {} as Trip,
        error: error instanceof Error ? error.message : "Trip update failed",
      };
    }
  }

  /**
   * Get trip customers/passengers
   */
  async getTripCustomers(tripId: string): Promise<TripCustomersResponse> {
    try {
      const response = await this.makeRequest<TripCustomersResponse>(
        `/admin-trip/list-trip-customers/${tripId}/`,
        {
          method: "GET",
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        data: [],
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch trip customers",
      };
    }
  }

  /**
   * Delete trip by ID
   */
  async deleteTrip(id: string): Promise<TripDeleteResponse> {
    try {
      const response = await this.makeRequest<TripDeleteResponse>(
        `/admin-trip/${id}/`,
        {
          method: "DELETE",
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete trip",
      };
    }
  }
}

// Export singleton instance
export const tripApiService = new TripApiService();
