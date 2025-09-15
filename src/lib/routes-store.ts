import { RouteConfig } from "@/types";

// Demo in-memory data - using global to persist across requests in development
declare global {
  var __routesData: Record<string, RouteConfig[]> | undefined;
}

const data: Record<string, RouteConfig[]> = globalThis.__routesData ?? {
  "lekki-phase-1-motor-park": [
    {
      id: "r_lekk_1",
      parkId: "lekki-phase-1-motor-park",
      destination: "Lagos",
      basePrice: 2500,
      vehicleCapacity: 14,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "r_lekk_2",
      parkId: "lekki-phase-1-motor-park",
      destination: "Abuja",
      basePrice: 8000,
      vehicleCapacity: 14,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  "ikeja-motor-park": [
    {
      id: "r_ikej_1",
      parkId: "ikeja-motor-park",
      destination: "Ibadan",
      basePrice: 2000,
      vehicleCapacity: 14,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "r_ikej_2",
      parkId: "ikeja-motor-park",
      destination: "Ilesa",
      basePrice: 3500,
      vehicleCapacity: 14,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "r_ikej_3",
      parkId: "ikeja-motor-park",
      destination: "Ondo",
      basePrice: 4000,
      vehicleCapacity: 14,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

// Persist data globally for development
globalThis.__routesData = data;

export function listRoutes(parkId: string): RouteConfig[] {
  return data[parkId] ?? [];
}

export function getRoute(id: string): RouteConfig | undefined {
  for (const parkId in data) {
    const found = data[parkId].find((r) => r.id === id);
    if (found) return found;
  }
  return undefined;
}

export function updateRoute(
  id: string,
  input: Partial<Pick<RouteConfig, "basePrice">>
): RouteConfig | undefined {
  for (const parkId in data) {
    const list = data[parkId];
    const idx = list.findIndex((r) => r.id === id);
    if (idx !== -1) {
      const now = new Date().toISOString();
      const updated: RouteConfig = {
        ...list[idx],
        ...input,
        updatedAt: now,
      };
      list[idx] = updated;
      return updated;
    }
  }
  return undefined;
}

interface CreateRouteInput {
  destination: string;
  basePrice: number;
  vehicleCapacity: number;
  isActive: boolean;
  parkId: string;
}

export function createRoute(input: CreateRouteInput): RouteConfig {
  const list = data[input.parkId] ?? (data[input.parkId] = []);
  const now = new Date().toISOString();
  const newRoute: RouteConfig = {
    id: `route_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    parkId: input.parkId,
    destination: input.destination,
    basePrice: input.basePrice,
    vehicleCapacity: input.vehicleCapacity,
    isActive: input.isActive,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newRoute);
  return newRoute;
}
