/**
 * Admin Stat API Service
 * Provides a centralized client for fetching dashboard statistics
 */

import { DashboardStats } from "@/types";
import { apiClient } from "@/lib/api-client";

export interface AdminStatResponse {
  success: boolean;
  data?: DashboardStats;
  message?: string;
  error?: string;
}

class AdminStatApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1/api/v1";
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    console.log(`Making admin-stat request to: ${url}`);

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, config);

      // attempt to parse JSON body for helpful error messages
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errMsg = data && (data.message || data.error) ? (data.message || data.error) : `${response.status} ${response.statusText}`;
        console.error("AdminStat API error", { status: response.status, url, data });
        throw new Error(errMsg);
      }

      // Normalize common backend shapes: { message: 'Success', data: {...} } or raw data object
      if (data && typeof data === "object") {
        if (data.success === true && data.data) {
          return { ...data } as T;
        }
        if (data.message === "Success" && data.data) {
          return { success: true, data: data.data } as unknown as T;
        }
        // If it's already the stats object
        const maybeStatsKeys = ["todayBookings", "todayRevenue", "activeRoutes"];
        if (maybeStatsKeys.every((k) => k in data)) {
          return { success: true, data } as unknown as T;
        }
      }

      return data as T;
    } catch (error) {
      console.error("AdminStat request failed:", error);
      throw error;
    }
  }

  async getStats(parkId?: string): Promise<AdminStatResponse> {
    try {
      const query = parkId ? `?park_id=${encodeURIComponent(parkId)}` : "";
      const endpoint = `/admin-stat/get_stat/${query}`;

      const resp = await apiClient.request<unknown>(endpoint, {
        method: "GET",
      });

      const respObj = resp as Record<string, unknown> | null;
        if (respObj && typeof respObj === "object") {
        // If backend returned wrapper { success: true, data: {...} }
        if (respObj.success === true && respObj.data) {
          const data = respObj.data as unknown as Record<string, unknown>;
          // If data already matches DashboardStats, return directly
          if (data && typeof data === "object" && "todayBookings" in data) {
            return { success: true, data: data as unknown as DashboardStats };
          }

          // Attempt to map common backend shape into DashboardStats
          const mapped: DashboardStats = {
            todayBookings: Number(data.total_booking ?? data.total_bookings ?? data.total_trips ?? 0),
            todayRevenue: Number(data.total_earning ?? data.total_revenue ?? data.totalRevenue ?? 0),
            activeRoutes: Number(data.total_active_trips ?? data.active_routes ?? 0),
            totalDrivers: Number(data.total_drivers ?? data.drivers_count ?? 0),
            weeklyBookings: Array.isArray(data.weeklyBookings)
              ? data.weeklyBookings
              : [],
            weeklyRevenue: Array.isArray(data.weeklyRevenue) ? data.weeklyRevenue : [],
            topRoutes: Array.isArray(data.top_routes)
              ? (data.top_routes as unknown[]).map((r) => {
                  const rr = r as Record<string, unknown>;
                  return {
                    destination:
                      (rr.destination as string) || (rr.to_state as string) || (rr.name as string) || "Unknown",
                    bookings: Number((rr.bookings as number) ?? (rr.total_bookings as number) ?? 0),
                    revenue: Number((rr.revenue as number) ?? (rr.total_revenue as number) ?? 0),
                  };
                })
              : [],
          };

          return { success: true, data: mapped };
        }

        // If resp itself looks like raw API data (message/data wrapper)
          const raw = respObj;
        if (raw && raw.data && typeof raw.data === "object") {
          const data = raw.data as Record<string, unknown>;
          const mapped: DashboardStats = {
            todayBookings: Number(data.total_booking ?? data.total_bookings ?? data.total_trips ?? 0),
            todayRevenue: Number(data.total_earning ?? data.total_revenue ?? data.totalRevenue ?? 0),
            activeRoutes: Number(data.total_active_trips ?? data.active_routes ?? 0),
            totalDrivers: Number(data.total_drivers ?? data.drivers_count ?? 0),
            weeklyBookings: Array.isArray(data.weeklyBookings) ? data.weeklyBookings : [],
            weeklyRevenue: Array.isArray(data.weeklyRevenue) ? data.weeklyRevenue : [],
            topRoutes: Array.isArray(data.top_routes)
              ? (data.top_routes as unknown[]).map((r) => {
                  const rr = r as Record<string, unknown>;
                  return {
                    destination:
                      (rr.destination as string) || (rr.to_state as string) || (rr.name as string) || "Unknown",
                    bookings: Number((rr.bookings as number) ?? (rr.total_bookings as number) ?? 0),
                    revenue: Number((rr.revenue as number) ?? (rr.total_revenue as number) ?? 0),
                  };
                })
              : [],
          };
          return { success: true, data: mapped };
        }
      }

      return { success: false, error: "Invalid response from stats API" };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export const adminStatService = new AdminStatApiService();
