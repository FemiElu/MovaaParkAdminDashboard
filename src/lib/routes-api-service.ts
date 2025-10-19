/**
 * Routes API Service
 * Handles communication with backend routes APIs
 */

import { BackendRoute, BackendRouteCreateData } from "@/types";

export interface RoutesApiResponse {
  success: boolean;
  data?: BackendRoute[];
  error?: string;
}

export interface RouteApiResponse {
  success: boolean;
  data?: BackendRoute;
  error?: string;
}

class RoutesApiService {
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
    console.log(`Making routes API request to: ${url}`);
    console.log(`Request options:`, options);

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

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
      const data = await response.json();

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

      return data as T;
    } catch (error) {
      console.error(`Routes API request failed for ${endpoint}:`, error);
      console.error(`Full URL attempted: ${url}`);
      throw error;
    }
  }

  /**
   * Get all routes
   */
  async getAllRoutes(token?: string): Promise<RoutesApiResponse> {
    try {
      const response = await this.makeRequest<RoutesApiResponse>(
        "/admin-route/",
        {
          method: "GET",
          token: token,
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch routes",
      };
    }
  }

  /**
   * Create a new route
   */
  async createRoute(
    routeData: BackendRouteCreateData,
    token?: string
  ): Promise<RouteApiResponse> {
    try {
      const response = await this.makeRequest<RouteApiResponse>(
        "/admin-route/",
        {
          method: "POST",
          body: JSON.stringify(routeData),
          token: token,
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create route",
      };
    }
  }

  /**
   * Delete a route by ID
   */
  async deleteRoute(routeId: string): Promise<RouteApiResponse> {
    try {
      const response = await this.makeRequest<RouteApiResponse>(
        `/admin-route/${routeId}/`,
        {
          method: "DELETE",
        }
      );

      return response;
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
export const routesApiService = new RoutesApiService();
