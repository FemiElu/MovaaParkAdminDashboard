/**
 * Lightweight API client used across services
 * Centralizes base URL, headers, token handling and JSON parsing
 */

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1/api/v1";
  }

  private getAuthHeader(): Record<string, string> {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.getAuthHeader(),
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };

    const res = await fetch(url, config);

    const text = await res.text().catch(() => "");
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // not JSON
      data = text;
    }

    if (!res.ok) {
      const message =
        (data && typeof data === "object" && (data as Record<string, unknown>).message) ||
        res.statusText ||
        String(data);
      throw new Error(String(message));
    }

    return data as T;
  }
}

export const apiClient = new ApiClient();
