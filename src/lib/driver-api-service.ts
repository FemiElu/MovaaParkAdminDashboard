/**
 * Driver API Service Layer
 * Handles communication with backend driver APIs
 */

export interface DriverOnboardData {
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string; // Format: "2025-10-14"
  address: string;
  nin: string;
  plate_number: string;
  email?: string; // optional for compatibility
  drivers_license?: string; // optional for compatibility
}

export interface Driver {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    address: string | null;
    is_email_generated: boolean;
    avatar: string;
    city: string | null;
    state: string | null;
    country: string | null;
    user_type: string[];
    is_active: boolean;
    next_of_kin: unknown[];
  };
  date_of_birth: string;
  address: string;
  is_licence_verified: boolean;
  plate_number: string;
}

export interface DriverListResponse {
  success: boolean;
  data: Driver[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}

export interface DriverResponse {
  success: boolean;
  data: Driver | null;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

class DriverApiService {
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
    console.log(`Making driver API request to: ${url}`);
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
      console.error(`Driver API request failed for ${endpoint}:`, error);
      console.error(`Full URL attempted: ${url}`);
      throw error;
    }
  }

  /**
   * Get all drivers
   */
  async getAllDrivers(token?: string): Promise<DriverListResponse> {
    try {
      const response = await this.makeRequest<DriverListResponse>("/driver/", {
        method: "GET",
        token: token,
      });

      return response;
    } catch (error) {
      return {
        success: false,
        data: [],
        error:
          error instanceof Error ? error.message : "Failed to fetch drivers",
      };
    }
  }

  /**
   * Get drivers by route (filtered by qualified routes)
   */
  async getDriversByRoute(
    routeId: string,
    token?: string
  ): Promise<DriverListResponse> {
    try {
      // First get all drivers
      const allDriversResponse = await this.getAllDrivers(token);

      if (!allDriversResponse.success) {
        return allDriversResponse;
      }

      // Filter drivers by route - this is a simplified approach
      // In a real implementation, you'd want to check the driver's qualified routes
      // For now, we'll return all drivers and let the frontend handle filtering
      return allDriversResponse;
    } catch (error) {
      return {
        success: false,
        data: [],
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch drivers by route",
      };
    }
  }

  /**
   * Onboard a new driver
   */
  async onboardDriver(
    driverData: DriverOnboardData | FormData,
    token?: string
  ): Promise<DriverResponse> {
    try {
      // Determine if we're sending FormData or JSON
      const isFormData = driverData instanceof FormData;

      const response = await this.makeRequest<DriverResponse>(
        "/driver/onboard/",
        {
          method: "POST",
          body: isFormData ? driverData : JSON.stringify(driverData),
          headers: isFormData ? {} : { "Content-Type": "application/json" },
          token: token,
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        data: null,
        error:
          error instanceof Error ? error.message : "Driver onboarding failed",
      };
    }
  }

  /**
   * Get driver by ID
   */
  async getDriver(id: string): Promise<DriverResponse> {
    try {
      const response = await this.makeRequest<DriverResponse>(
        `/driver/${id}/`,
        {
          method: "GET",
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        data: null,
        error:
          error instanceof Error ? error.message : "Failed to fetch driver",
      };
    }
  }

  /**
   * Delete driver by ID
   */
  async deleteDriver(id: string): Promise<DriverResponse> {
    try {
      const response = await this.makeRequest<DriverResponse>(
        `/driver/${id}/`,
        {
          method: "DELETE",
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        data: null,
        error:
          error instanceof Error ? error.message : "Failed to delete driver",
      };
    }
  }
}

// Export singleton instance
export const driverApiService = new DriverApiService();
