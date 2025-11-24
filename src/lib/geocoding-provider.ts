/**
 * Geocoding Provider Abstraction Layer
 * 
 * This allows easy switching between geocoding providers (Nominatim, Google Maps, etc.)
 * Currently using Nominatim (free), but can switch to Google Maps or other providers
 */

export interface GeocodingProvider {
  name: string;
  searchAddress(query: string): Promise<SearchResult[]>;
  reverseGeocode(lat: number, lng: number): Promise<AddressResult>;
}

export interface SearchResult {
  displayName: string;
  latitude: number;
  longitude: number;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface AddressResult {
  formattedAddress: string;
  city?: string;
  state?: string;
  country?: string;
}

/**
 * Nominatim (OpenStreetMap) Provider - FREE
 * Routes all requests through server-side API to avoid CORS issues
 */
export class NominatimProvider implements GeocodingProvider {
  name = "Nominatim";

  async searchAddress(query: string): Promise<SearchResult[]> {
    try {
      // Use our server-side API to avoid CORS
      const params = new URLSearchParams({
        q: query,
      });

      const response = await fetch(`/api/geocoding/search?${params}`);

      if (!response.ok) {
        throw new Error(`Search request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error("Nominatim search error:", data.error);
        return [];
      }

      return data.results || [];
    } catch (error) {
      console.error("Nominatim search error:", error);
      return [];
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<AddressResult> {
    try {
      // Use our server-side API to avoid CORS
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
      });

      const response = await fetch(`/api/geocoding/reverse?${params}`);

      if (!response.ok) {
        throw new Error(`Reverse geocode request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error("Nominatim reverse geocode error:", data.error);
      }

      return {
        formattedAddress: data.formattedAddress || `${lat}, ${lng}`,
        city: data.city,
        state: data.state,
        country: data.country,
      };
    } catch (error) {
      console.error("Nominatim reverse geocode error:", error);
      return {
        formattedAddress: `${lat}, ${lng}`,
      };
    }
  }
}

/**
 * Google Maps Provider (Future Implementation)
 * 
 * To switch to Google Maps:
 * 1. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env
 * 2. Uncomment this class
 * 3. Change the provider in location-picker.tsx
 */
/*
export class GoogleMapsProvider implements GeocodingProvider {
  name = "Google Maps";
  private apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  async searchAddress(query: string): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      input: query,
      types: "geocode",
      components: "country:ng",
      key: this.apiKey!,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
    );

    const data = await response.json();

    // Would need to get place details for each result to get coordinates
    // This is a simplified example
    return data.predictions.map((item: any) => ({
      displayName: item.description,
      latitude: 0, // Would get from place details API
      longitude: 0,
    }));
  }

  async reverseGeocode(lat: number, lng: number): Promise<AddressResult> {
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      key: this.apiKey!,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}`
    );

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return {
        formattedAddress: data.results[0].formatted_address,
        city: data.results[0].address_components.find((c: any) =>
          c.types.includes("locality")
        )?.long_name,
        state: data.results[0].address_components.find((c: any) =>
          c.types.includes("administrative_area_level_1")
        )?.long_name,
        country: data.results[0].address_components.find((c: any) =>
          c.types.includes("country")
        )?.long_name,
      };
    }

    return {
      formattedAddress: `${lat}, ${lng}`,
    };
  }
}
*/

// Export the current provider
// To switch to Google Maps later, just change this line:
// export const geocodingProvider = new GoogleMapsProvider();
export const geocodingProvider = new NominatimProvider();
