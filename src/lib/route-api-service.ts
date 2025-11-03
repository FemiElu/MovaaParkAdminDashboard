/**
 * Route API Service Layer
 * Handles communication with backend route APIs
 */

export interface RouteOnboardData {
  from_state: string;
  to_state: string;
  to_city: string;
  bus_stop: string;
}

export interface Route {
  id: string;
  from_state: string;
  to_state: string;
  to_city: string;
  bus_stop: string;
  created_at?: string;
  updated_at?: string;
}

export interface RouteListResponse {
  success: boolean;
  data: Route[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface RouteResponse {
  success: boolean;
  data?: Route;
  message?: string;
  error?: string;
}

export interface RouteDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

class RouteApiService {
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
    console.log(`Making route API request to: ${url}`);
    console.log(`Request options:`, options);

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authorization header if we have a token
    const token = localStorage.getItem("auth_token");
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
      console.log(
        "Route API - Authorization header:",
        `Bearer ${token.substring(0, 20)}...`
      );
    } else {
      console.log("Route API - No auth token found in localStorage");
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

      // Handle 204 No Content or empty body safely
      if (response.status === 204) {
        return {} as T;
      }
      const text = await response.text();
      if (!text) {
        return {} as T;
      }
      const data = JSON.parse(text);
      return data;
    } catch (error) {
      console.error(`Route API request failed for ${endpoint}:`, error);
      console.error(`Full URL attempted: ${url}`);
      throw error;
    }
  }

  /**
   * Get all routes
   */
  async getAllRoutes(): Promise<RouteListResponse> {
    try {
      const response = await this.makeRequest<{
        message: string;
        data: unknown[];
        errors: unknown;
        count?: number;
        current_page?: number;
      }>("/admin-route/", {
        method: "GET",
      });

      console.log(
        "getAllRoutes - raw response:",
        JSON.stringify(response, null, 2)
      );
      console.log("getAllRoutes - response?.data type:", typeof response?.data);
      console.log(
        "getAllRoutes - response?.data is array?:",
        Array.isArray(response?.data)
      );
      console.log("getAllRoutes - response?.message:", response?.message);

      // Check if data exists but isn't an array
      if (response?.data && !Array.isArray(response.data)) {
        console.warn("getAllRoutes - data is not an array:", response.data);
        console.warn(
          "getAllRoutes - data value:",
          JSON.stringify(response.data, null, 2)
        );

        // Try to extract routes from nested structures
        if (response.data && typeof response.data === "object") {
          const dataObj = response.data as Record<string, unknown>;
          console.warn("getAllRoutes - checking for nested routes property...");
          if (Array.isArray(dataObj.routes)) {
            console.log("getAllRoutes - found nested 'routes' array");
            response.data = dataObj.routes;
          } else if (Array.isArray(dataObj.data)) {
            console.log("getAllRoutes - found nested 'data' array");
            response.data = dataObj.data;
          }
        }
      }

      // Normalize backend shape
      // Backend can return either:
      // 1. { message: "Success", data: [...] } format
      // 2. { count: X, data: [...], total_pages: X, current_page: X } format (pagination)
      const normalized: RouteListResponse = {
        success:
          response?.message === "Success" ||
          (response?.data !== undefined && Array.isArray(response.data)),
        data: Array.isArray(response?.data) ? (response.data as Route[]) : [],
        total: response?.count,
        page: response?.current_page,
        limit: undefined,
      };

      console.log(
        "getAllRoutes - normalized response:",
        JSON.stringify(normalized, null, 2)
      );
      console.log(`getAllRoutes - found ${normalized.data.length} routes`);

      // Log each route's key fields for debugging
      if (normalized.data.length > 0) {
        normalized.data.forEach((route, index) => {
          console.log(`Route ${index}:`, {
            id: route.id,
            to_city: route.to_city,
            to_state: route.to_state,
            from_state: route.from_state,
          });
        });
      }

      return normalized;
    } catch (error) {
      console.error("getAllRoutes - error:", error);
      return {
        success: false,
        data: [],
      };
    }
  }

  /**
   * Create a new route
   */
  async createRoute(routeData: RouteOnboardData): Promise<RouteResponse> {
    try {
      const response = await this.makeRequest<{
        message: string;
        data: unknown[];
        errors: unknown;
      }>("/admin-route/", {
        method: "POST",
        body: JSON.stringify(routeData),
      });

      // Normalize backend shape { message, data, errors }
      const normalized: RouteResponse = {
        success: response?.message === "Success",
        data: response?.data as unknown as Route,
        message: response?.message,
        error:
          typeof response?.errors === "string"
            ? response.errors
            : (response?.errors as { message?: string })?.message ||
              "Unknown error",
      };

      return normalized;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Route creation failed",
      };
    }
  }

  /**
   * Get route by ID
   */
  async getRoute(id: string): Promise<RouteResponse> {
    try {
      const response = await this.makeRequest<{
        message: string;
        data: unknown;
        errors: unknown;
      }>(`/admin-route/${id}/`, {
        method: "GET",
      });

      // Normalize backend shape { message, data, errors }
      const normalized: RouteResponse = {
        success: response?.message === "Success",
        data: response?.data as unknown as Route,
        message: response?.message,
        error:
          typeof response?.errors === "string"
            ? response.errors
            : (response?.errors as { message?: string })?.message ||
              "Unknown error",
      };

      return normalized;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch route",
      };
    }
  }

  /**
   * Delete route by ID
   */
  async deleteRoute(id: string): Promise<RouteDeleteResponse> {
    try {
      const response = await this.makeRequest<{
        message: string;
        data: unknown;
        errors: unknown;
      }>(`/admin-route/${id}/`, {
        method: "DELETE",
      });

      const msg = (response?.message || "").toLowerCase();
      const isEmpty =
        response === undefined || Object.keys(response || {}).length === 0;
      const normalized: RouteDeleteResponse = {
        // Consider typical success patterns: "Success", "Route deleted", and empty 204/empty bodies
        success: isEmpty || msg === "success" || msg.includes("deleted"),
        message: response?.message || (isEmpty ? "Success" : undefined),
        error:
          typeof response?.errors === "string"
            ? response.errors
            : (response?.errors as { message?: string })?.message ||
              "Unknown error",
      };

      return normalized;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete route",
      };
    }
  }
}

// Export singleton instance
export const routeApiService = new RouteApiService();
