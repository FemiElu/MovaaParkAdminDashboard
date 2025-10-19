/**
 * Route conversion utilities
 * Converts between backend API format and frontend format
 */

import { BackendRoute, RouteConfig } from "@/types";

/**
 * Convert backend route to frontend route format
 */
export function backendRouteToFrontend(
  backendRoute: BackendRoute,
  parkId: string
): RouteConfig {
  return {
    id: backendRoute.id,
    parkId: parkId,
    destination: backendRoute.to_city || backendRoute.to_state,
    destinationPark: backendRoute.bus_stop || undefined,
    isActive: true, // Backend doesn't have isActive field, assume active
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Convert frontend route to backend creation format
 */
export function frontendRouteToBackend(routeData: {
  destination: string;
  destinationPark?: string;
  from_state?: string;
}): {
  from_state: string;
  to_state: string;
  to_city: string;
  bus_stop: string;
} {
  // Extract state and city from destination
  // This is a simple mapping - you might want to enhance this based on your data
  const destination = routeData.destination;

  // For now, we'll use a simple mapping
  // In a real app, you might have a lookup table or API for state/city mapping
  const stateCityMap: Record<string, { state: string; city: string }> = {
    Ibadan: { state: "Oyo", city: "Ibadan" },
    Abuja: { state: "FCT", city: "Abuja" },
    Lagos: { state: "Lagos", city: "Lagos" },
    Kano: { state: "Kano", city: "Kano" },
    "Port Harcourt": { state: "Rivers", city: "Port Harcourt" },
    Ilesa: { state: "Osun", city: "Ilesa" },
    Ondo: { state: "Ondo", city: "Ondo" },
    Akure: { state: "Ondo", city: "Akure" },
    Osogbo: { state: "Osun", city: "Osogbo" },
    "Ado-Ekiti": { state: "Ekiti", city: "Ado-Ekiti" },
  };

  const mapped = stateCityMap[destination] || {
    state: destination,
    city: destination,
  };

  return {
    from_state: routeData.from_state || "Lagos", // Default from state
    to_state: mapped.state,
    to_city: mapped.city,
    bus_stop: routeData.destinationPark || "",
  };
}

