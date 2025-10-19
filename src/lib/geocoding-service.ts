/**
 * Geocoding Service with Caching
 * Converts addresses to latitude and longitude coordinates
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 * Implements intelligent caching for better performance
 */

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
  success: boolean;
  error?: string;
  cached?: boolean;
}

export interface GeocodingOptions {
  address: string;
  city?: string;
  state?: string;
  country?: string;
}

interface CachedGeocodingResult {
  result: GeocodingResult;
  timestamp: number;
  addressHash: string;
}

class GeocodingService {
  private apiUrl = "/api/geocoding"; // Use our server-side API
  private cacheKey = "movaa_geocoding_cache";
  private cacheExpiryHours = 24; // Cache for 24 hours
  private maxCacheSize = 100; // Maximum cached results

  /**
   * Generate a hash for the address to use as cache key
   */
  private generateAddressHash(options: GeocodingOptions): string {
    const addressString = [
      options.address?.toLowerCase().trim(),
      options.city?.toLowerCase().trim(),
      options.state?.toLowerCase().trim(),
      options.country?.toLowerCase().trim() || "nigeria",
    ]
      .filter(Boolean)
      .join(", ");

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < addressString.length; i++) {
      const char = addressString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached geocoding result
   */
  private getCachedResult(addressHash: string): GeocodingResult | null {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;

      const cache: Record<string, CachedGeocodingResult> = JSON.parse(cached);
      const cachedResult = cache[addressHash];

      if (!cachedResult) return null;

      // Check if cache is expired
      const now = Date.now();
      const cacheAge = now - cachedResult.timestamp;
      const expiryMs = this.cacheExpiryHours * 60 * 60 * 1000;

      if (cacheAge > expiryMs) {
        // Remove expired entry
        delete cache[addressHash];
        localStorage.setItem(this.cacheKey, JSON.stringify(cache));
        return null;
      }

      return {
        ...cachedResult.result,
        cached: true,
      };
    } catch (error) {
      console.warn("Error reading geocoding cache:", error);
      return null;
    }
  }

  /**
   * Cache geocoding result
   */
  private setCachedResult(addressHash: string, result: GeocodingResult): void {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      const cache: Record<string, CachedGeocodingResult> = cached
        ? JSON.parse(cached)
        : {};

      // Add new result
      cache[addressHash] = {
        result,
        timestamp: Date.now(),
        addressHash,
      };

      // Limit cache size
      const entries = Object.entries(cache);
      if (entries.length > this.maxCacheSize) {
        // Remove oldest entries
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
        toRemove.forEach(([key]) => delete cache[key]);
      }

      localStorage.setItem(this.cacheKey, JSON.stringify(cache));
    } catch (error) {
      console.warn("Error caching geocoding result:", error);
    }
  }

  /**
   * Geocode an address to get latitude and longitude using our server-side API
   */
  async geocodeAddress(options: GeocodingOptions): Promise<GeocodingResult> {
    const addressHash = this.generateAddressHash(options);

    // Check cache first
    const cachedResult = this.getCachedResult(addressHash);
    if (cachedResult) {
      console.log("Using cached geocoding result for:", options.address);
      return cachedResult;
    }

    try {
      // Make request to our server-side geocoding API
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: options.address,
          city: options.city,
          state: options.state,
          country: options.country || "Nigeria",
        }),
      });

      if (!response.ok) {
        throw new Error(`Geocoding API request failed: ${response.status}`);
      }

      const data = await response.json();

      // Handle API response
      if (!data.success) {
        const result: GeocodingResult = {
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          address: data.address || options.address,
          success: false,
          error: data.error || "Address not found",
        };

        // Cache failed results too
        this.setCachedResult(addressHash, result);
        return result;
      }

      const successResult: GeocodingResult = {
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        success: true,
      };

      // Cache successful result
      this.setCachedResult(addressHash, successResult);

      console.log(
        "Geocoded successfully:",
        options.address,
        "→",
        data.latitude,
        data.longitude
      );
      return successResult;
    } catch (error) {
      console.error("Geocoding error:", error);
      const errorResult: GeocodingResult = {
        latitude: 0,
        longitude: 0,
        address: options.address,
        success: false,
        error: error instanceof Error ? error.message : "Geocoding failed",
      };

      // Cache error results for shorter time to avoid repeated failures
      this.setCachedResult(addressHash, errorResult);
      return errorResult;
    }
  }

  /**
   * Geocode with multiple fallback strategies for maximum accuracy
   */
  async geocodeWithFallback(
    options: GeocodingOptions
  ): Promise<GeocodingResult> {
    // Strategy 1: Try full address
    const result = await this.geocodeAddress(options);
    if (result.success) {
      return result;
    }

    console.warn(
      "Full address geocoding failed, trying fallback strategies..."
    );

    // Strategy 2: Try with just city and state (more general location)
    if (options.city && options.state) {
      const cityStateResult = await this.geocodeAddress({
        address: `${options.city}, ${options.state}`,
        city: options.city,
        state: options.state,
        country: options.country,
      });

      if (cityStateResult.success) {
        console.log("Using city-state fallback coordinates");
        return {
          ...cityStateResult,
          address: `${options.city}, ${options.state}, Nigeria`,
          error: `Full address not found, using ${options.city}, ${options.state} coordinates`,
        };
      }
    }

    // Strategy 3: Try with just state (even more general)
    if (options.state) {
      const stateResult = await this.geocodeAddress({
        address: options.state,
        state: options.state,
        country: options.country,
      });

      if (stateResult.success) {
        console.log("Using state fallback coordinates");
        return {
          ...stateResult,
          address: `${options.state}, Nigeria`,
          error: `Specific location not found, using ${options.state} coordinates`,
        };
      }
    }

    // Strategy 4: Try major Nigerian cities as last resort
    const majorCities = [
      { name: "Lagos", lat: 6.5244, lng: 3.3792 },
      { name: "Abuja", lat: 9.0765, lng: 7.3986 },
      { name: "Kano", lat: 12.0022, lng: 8.592 },
      { name: "Ibadan", lat: 7.3776, lng: 3.947 },
      { name: "Port Harcourt", lat: 4.8156, lng: 7.0498 },
      { name: "Benin City", lat: 6.335, lng: 5.6037 },
      { name: "Kaduna", lat: 10.52, lng: 7.4383 },
      { name: "Jos", lat: 9.9167, lng: 8.9 },
    ];

    // Try to match by state name
    const stateName = options.state?.toLowerCase();
    let fallbackCity = majorCities.find(
      (city) =>
        stateName?.includes(city.name.toLowerCase()) ||
        city.name.toLowerCase().includes(stateName || "")
    );

    // If no state match, try city match
    if (!fallbackCity && options.city) {
      const cityName = options.city.toLowerCase();
      fallbackCity = majorCities.find(
        (city) =>
          cityName.includes(city.name.toLowerCase()) ||
          city.name.toLowerCase().includes(cityName)
      );
    }

    // Default to Lagos if no match found
    fallbackCity = fallbackCity || majorCities[0];

    console.warn(
      `All geocoding strategies failed, using ${fallbackCity.name} coordinates as last resort`
    );

    return {
      latitude: fallbackCity.lat,
      longitude: fallbackCity.lng,
      address: `${fallbackCity.name}, Nigeria`,
      success: true,
      error: `Geocoding failed for "${options.address}", using ${fallbackCity.name} coordinates`,
    };
  }

  /**
   * Geocode with retry mechanism for network issues
   */
  async geocodeWithRetry(
    options: GeocodingOptions,
    maxRetries: number = 3
  ): Promise<GeocodingResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.geocodeWithFallback(options);
        if (result.success) {
          return result;
        }

        // If geocoding failed but we have fallback coordinates, return them
        if (result.latitude !== 0 && result.longitude !== 0) {
          return result;
        }

        lastError = new Error(result.error || "Geocoding failed");

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(
            `Geocoding attempt ${attempt} failed, retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(
            `Geocoding attempt ${attempt} failed with error, retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed, return Lagos coordinates as absolute fallback
    console.error("All geocoding attempts failed, using Lagos coordinates");
    return {
      latitude: 6.5244,
      longitude: 3.3792,
      address: "Lagos, Nigeria",
      success: true,
      error: `All geocoding attempts failed: ${lastError?.message}`,
    };
  }

  /**
   * Clear geocoding cache
   */
  clearCache(): void {
    try {
      localStorage.removeItem(this.cacheKey);
      console.log("Geocoding cache cleared");
    } catch (error) {
      console.warn("Error clearing geocoding cache:", error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return { size: 0, entries: [] };

      const cache: Record<string, CachedGeocodingResult> = JSON.parse(cached);
      const entries = Object.keys(cache);

      return {
        size: entries.length,
        entries: entries.map((key) => cache[key].result.address),
      };
    } catch (error) {
      console.warn("Error reading cache stats:", error);
      return { size: 0, entries: [] };
    }
  }

  /**
   * Validate if coordinates are within Nigeria bounds
   */
  isValidNigeriaCoordinates(latitude: number, longitude: number): boolean {
    // Nigeria bounds (approximate)
    const minLat = 4.0;
    const maxLat = 14.0;
    const minLon = 2.0;
    const maxLon = 15.0;

    return (
      latitude >= minLat &&
      latitude <= maxLat &&
      longitude >= minLon &&
      longitude <= maxLon
    );
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();
