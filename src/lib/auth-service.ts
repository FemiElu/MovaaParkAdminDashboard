/**
 * Authentication Service Layer
 * Handles communication with backend authentication APIs
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  user_type?: string[];
  role?: "PARK_ADMIN" | "SUPER_ADMIN";
  parkId?: string;
  park?: {
    id: string;
    name: string;
    address: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  };
  terminal?: {
    name: string;
    address: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  };
  is_active?: boolean;
  isActive?: boolean;
  is_email_generated?: boolean;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  phone_number: string;
  password: string;
}

export interface SignupData {
  email: string;
  phone_number: string;
  password: string;
  terminal_name: string;
  terminal_address: string;
  terminal_city: string;
  terminal_state: string;
  terminal_latitude: number;
  terminal_longitude: number;
}

export interface ForgotPasswordData {
  phone_number: string;
}

export interface ResetPasswordData {
  phone_number: string;
  password: string;
  otp: string;
}

export interface VerifySignupData {
  otp: string;
  phone_number: string;
}

export interface ChangePasswordData {
  password: string;
}

export interface UpdateProfileData {
  first_name: string;
  last_name: string;
  email: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
}

export interface UpdatePhoneData {
  phone_number: string;
}

export interface VerifyPhoneUpdateData {
  phone_number: string;
  otp: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string | { access: string; refresh: string }; // Backend returns object with access/refresh
  refreshToken?: string;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

class AuthService {
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
    console.log(`Making API request to: ${url}`);
    console.log(`Request options:`, options);

    const defaultHeaders = {
      "Content-Type": "application/json",
    };

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
        // Try to parse error body but don't throw - return a normalized error
        const errorData = await response.json().catch(() => ({}));
        const parsedMessage =
          (errorData && (errorData.message || errorData.error)) ||
          response.statusText ||
          `HTTP error! status: ${response.status}`;

        // Minimal console warning for debugging (no stack trace)
        console.warn(`API request returned non-OK status ${response.status}: ${parsedMessage}`);

        // Return a normalized error-shaped response so callers can handle it
        const normalizedError = {
          success: false,
          error: parsedMessage,
          message: parsedMessage,
          status: response.status,
          details: errorData,
        } as unknown as T;

        return normalizedError;
      }

      const data = await response.json();

      // Debug: Log the raw API response to understand the data structure
      console.log("Raw API response data:", JSON.stringify(data, null, 2));

      // If backend indicates Success but no user payload (e.g., signup), normalize to success: true
      if (
        data &&
        data.message === "Success" &&
        !(data?.data && data?.data.user)
      ) {
        const normalized = {
          success: true,
          message:
            typeof data.data?.message === "string"
              ? data.data.message
              : data.message,
          // surface nested fields if any (but no user/token)
          ...data.data,
        } as unknown as T;
        return normalized;
      }

      // Transform API response format to match AuthResponse interface whenever a user is present
      if (data && data.data && data.data.user) {
        // Transform user data from backend to our expected interface
        const user = data.data?.user
          ? {
              ...data.data.user,
              // Map user_type array to role for compatibility
              role: data.data.user.user_type?.includes("ADMIN")
                ? "PARK_ADMIN"
                : "SUPER_ADMIN",
              // Map is_active to isActive for compatibility
              isActive: data.data.user.is_active,
              // Create name from first_name and last_name if not present
              name:
                data.data.user.name ||
                `${data.data.user.first_name || ""} ${
                  data.data.user.last_name || ""
                }`.trim(),
              // Map terminal/park information
              terminal: data.data.user.terminal
                ? {
                    name:
                      data.data.user.terminal.terminal_name ||
                      data.data.user.terminal.name,
                    address:
                      data.data.user.terminal.terminal_address ||
                      data.data.user.terminal.address,
                    city:
                      data.data.user.terminal.terminal_city ||
                      data.data.user.terminal.city,
                    state:
                      data.data.user.terminal.terminal_state ||
                      data.data.user.terminal.state,
                    latitude:
                      data.data.user.terminal.terminal_latitude ||
                      data.data.user.terminal.latitude,
                    longitude:
                      data.data.user.terminal.terminal_longitude ||
                      data.data.user.terminal.longitude,
                  }
                : undefined,
              // Map park information (fallback or alternative structure)
              park: data.data.user.park
                ? {
                    id: data.data.user.park.id,
                    name:
                      data.data.user.park.name ||
                      data.data.user.park.terminal_name,
                    address:
                      data.data.user.park.address ||
                      data.data.user.park.terminal_address,
                    city:
                      data.data.user.park.city ||
                      data.data.user.park.terminal_city,
                    state:
                      data.data.user.park.state ||
                      data.data.user.park.terminal_state,
                    latitude:
                      data.data.user.park.latitude ||
                      data.data.user.park.terminal_latitude,
                    longitude:
                      data.data.user.park.longitude ||
                      data.data.user.park.terminal_longitude,
                  }
                : data.data.user.terminal
                ? {
                    id: data.data.user.terminal.id || "terminal-" + Date.now(),
                    name:
                      data.data.user.terminal.terminal_name ||
                      data.data.user.terminal.name,
                    address:
                      data.data.user.terminal.terminal_address ||
                      data.data.user.terminal.address,
                    city:
                      data.data.user.terminal.terminal_city ||
                      data.data.user.terminal.city,
                    state:
                      data.data.user.terminal.terminal_state ||
                      data.data.user.terminal.state,
                    latitude:
                      data.data.user.terminal.terminal_latitude ||
                      data.data.user.terminal.latitude,
                    longitude:
                      data.data.user.terminal.terminal_longitude ||
                      data.data.user.terminal.longitude,
                  }
                : undefined,
            }
          : undefined;

        // Debug: Log the transformed user data
        console.log("Transformed user data:", JSON.stringify(user, null, 2));

        // Temporary fallback: If no terminal/park data from backend, use localStorage
        if (user && !user.terminal && !user.park) {
          const storedTerminalData = localStorage.getItem(
            "movaa_terminal_data"
          );
          if (storedTerminalData) {
            try {
              const terminalData = JSON.parse(storedTerminalData);
              user.terminal = {
                name: terminalData.terminal_name,
                address: terminalData.terminal_address,
                city: terminalData.terminal_city,
                state: terminalData.terminal_state,
                latitude: terminalData.terminal_latitude,
                longitude: terminalData.terminal_longitude,
              };
              user.park = {
                id: "temp-park-id",
                name: terminalData.terminal_name,
                address: terminalData.terminal_address,
                city: terminalData.terminal_city,
                state: terminalData.terminal_state,
                latitude: terminalData.terminal_latitude,
                longitude: terminalData.terminal_longitude,
              };
              console.log(
                "Applied fallback terminal data from localStorage:",
                user.terminal
              );
            } catch (error) {
              console.warn("Failed to parse stored terminal data:", error);
            }
          }
        }

        const transformedData = {
          success: response.ok && data.message === "Success",
          message: data.message,
          error: data.errors ? data.errors.join(", ") : undefined,
          // Extract user and tokens from nested data structure
          user,
          token: data.data?.token?.access || undefined,
          refreshToken: data.data?.token?.refresh || undefined,
          // Include any other data from the API
          ...data.data,
        };
        return transformedData as T;
      }

      return data;
    } catch (error) {
      // Log a compact warning and return a normalized failure so callers don't get noisy stack traces
      const message =
        error instanceof Error ? error.message : `API request failed for ${endpoint}`;
      console.warn(`API request failed for ${endpoint}: ${message}`);

      const normalizedError = {
        success: false,
        error: message,
        message,
      } as unknown as T;

      return normalizedError;
    }
  }

  /**
   * Authenticate user with phone number and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log("Login attempt with credentials:", credentials);
      console.log("Login request URL:", `${this.baseUrl}/auth/login/`);

      const response = await this.makeRequest<AuthResponse>("/auth/login/", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      console.log("Login API response:", response);

      // Store tokens in localStorage for client-side access
      if (response.token) {
        // Handle token as object (backend returns {access: "...", refresh: "..."})
        if (typeof response.token === "object" && response.token.access) {
          const accessToken = response.token.access;
          localStorage.setItem("auth_token", accessToken);
          console.log(
            "Stored auth token:",
            accessToken.substring(0, 20) + "..."
          );
        } else if (typeof response.token === "string") {
          // Handle token as string (legacy format)
          const tokenValue = response.token.startsWith("Bearer ")
            ? response.token.substring(7)
            : response.token;
          localStorage.setItem("auth_token", tokenValue);
          console.log(
            "Stored auth token:",
            tokenValue.substring(0, 20) + "..."
          );
        } else {
          console.log("Unexpected token format:", response.token);
        }
      } else {
        console.log("No token in response:", response);
      }
      if (response.refreshToken) {
        localStorage.setItem("refresh_token", response.refreshToken);
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }

  /**
   * Register a new admin user
   */
  async signup(userData: SignupData): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<AuthResponse>(
        "/auth/admin-signup/",
        {
          method: "POST",
          body: JSON.stringify(userData),
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      };
    }
  }

  /**
   * Verify admin signup with OTP
   */
  async verifySignup(
    verificationData: VerifySignupData
  ): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<AuthResponse>(
        "/auth/verify-signup/",
        {
          method: "POST",
          body: JSON.stringify(verificationData),
        }
      );

      // Store tokens if verification includes auto-login
      if (response.token) {
        // Handle token as object (backend returns {access: "...", refresh: "..."})
        if (typeof response.token === "object" && response.token.access) {
          localStorage.setItem("auth_token", response.token.access);
        } else if (typeof response.token === "string") {
          // Handle token as string (legacy format)
          const tokenValue = response.token.startsWith("Bearer ")
            ? response.token.substring(7)
            : response.token;
          localStorage.setItem("auth_token", tokenValue);
        }
      }
      if (response.refreshToken) {
        localStorage.setItem("refresh_token", response.refreshToken);
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }

  /**
   * Initiate password reset
   */
  async forgotPassword(data: ForgotPasswordData): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<AuthResponse>(
        "/auth/forgot-password/",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Password reset failed",
      };
    }
  }

  /**
   * Complete password reset with OTP
   */
  async resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<AuthResponse>(
        "/auth/reset-password/",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Password reset failed",
      };
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        return {
          success: false,
          error: "No authentication token found",
        };
      }

      const response = await this.makeRequest<AuthResponse>("/user/profile/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get user profile",
      };
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        return {
          success: false,
          error: "No refresh token found",
        };
      }

      const response = await this.makeRequest<AuthResponse>(
        "/auth/refresh-token/",
        {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );

      // Update stored tokens
      if (response.token) {
        // Handle token as object (backend returns {access: "...", refresh: "..."})
        if (typeof response.token === "object" && response.token.access) {
          localStorage.setItem("auth_token", response.token.access);
        } else if (typeof response.token === "string") {
          // Handle token as string (legacy format)
          const tokenValue = response.token.startsWith("Bearer ")
            ? response.token.substring(7)
            : response.token;
          localStorage.setItem("auth_token", tokenValue);
        }
      }
      if (response.refreshToken) {
        localStorage.setItem("refresh_token", response.refreshToken);
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Token refresh failed",
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem("auth_token");

      if (token) {
        await this.makeRequest("/auth/logout/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Clear local storage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");

      return {
        success: true,
        message: "Logged out successfully",
      };
    } catch {
      // Clear local storage even if API call fails
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");

      return {
        success: true,
        message: "Logged out locally",
      };
    }
  }

  /**
   * Update user profile (authenticated)
   */
  async updateProfile(data: UpdateProfileData): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        return {
          success: false,
          error: "No authentication token found",
        };
      }

      const response = await this.makeRequest<AuthResponse>(
        "/user/update-profile/",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Profile update failed",
      };
    }
  }

  /**
   * Change user password (authenticated)
   */
  async changePassword(data: ChangePasswordData): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        return {
          success: false,
          error: "No authentication token found",
        };
      }

      const response = await this.makeRequest<AuthResponse>(
        "/user/change-password/",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Password change failed",
      };
    }
  }

  /**
   * Update phone number (authenticated)
   */
  async updatePhoneNumber(data: UpdatePhoneData): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        return {
          success: false,
          error: "No authentication token found",
        };
      }

      const response = await this.makeRequest<AuthResponse>(
        "/user/update-phone/",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Phone update failed",
      };
    }
  }

  /**
   * Verify phone number update with OTP
   */
  async verifyPhoneUpdate(data: VerifyPhoneUpdateData): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        return {
          success: false,
          error: "No authentication token found",
        };
      }

      const response = await this.makeRequest<AuthResponse>(
        "/user/verify-phone-update/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Phone verification failed",
      };
    }
  }

  /**
   * Get available parks (for park admin registration)
   */
  async getParks(): Promise<{
    success: boolean;
    data?: unknown[];
    error?: string;
  }> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        data: unknown[];
      }>("/parks", {
        method: "GET",
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch parks",
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem("auth_token");
  }

  /**
   * Get stored auth token
   */
  getToken(): string | null {
    return localStorage.getItem("auth_token");
  }
}

// Export singleton instance
export const authService = new AuthService();
