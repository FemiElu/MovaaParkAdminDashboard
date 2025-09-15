import {
  type Driver,
  type TripAssignment,
  type PaginatedResponse,
} from "@/types";
import { filterDrivers, type DriverFilter } from "@/lib/driver-filters";

export interface CreateDriverInput {
  parkId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry?: string;
  qualifiedRoute: string; // Single route destination
  isActive: boolean;
  rating?: number;
  vehiclePlateNumber?: string;
  address?: string;
  photo?: string;
}

// Demo in-memory data - using global to persist across requests in development
declare global {
  var __driversData: Record<string, Driver[]> | undefined;
}

const data: Record<string, Driver[]> = globalThis.__driversData ?? {
  "lekki-phase-1-motor-park": [
    {
      id: "d_lekk_1",
      parkId: "lekki-phase-1-motor-park",
      name: "Adewale Ibrahim",
      phone: "+2348030000000",
      licenseNumber: "AAA000-0",
      licenseExpiry: new Date(Date.now() + 30 * 86400000).toISOString(),
      qualifiedRoute: "Lagos",
      isActive: true,
      rating: 5,
      vehiclePlateNumber: "ABC-123DE",
      address: "Lekki Phase 1, Lagos",
      photo: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [{ type: "DRIVER_LICENSE", number: "AAA000-0" }],
    },
    {
      id: "d_lekk_2",
      parkId: "lekki-phase-1-motor-park",
      name: "Chinedu Okafor",
      phone: "+2348031111111",
      licenseNumber: "BBB111-1",
      licenseExpiry: new Date(Date.now() + 5 * 86400000).toISOString(),
      qualifiedRoute: "Abuja",
      isActive: true,
      rating: 4,
      vehiclePlateNumber: "DEF-456GH",
      address: "Victoria Island, Lagos",
      photo: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [{ type: "DRIVER_LICENSE", number: "BBB111-1" }],
    },
    {
      id: "d_lekk_3",
      parkId: "lekki-phase-1-motor-park",
      name: "Hassan Musa",
      phone: "+2348032222222",
      licenseNumber: "CCC222-2",
      licenseExpiry: new Date(Date.now() - 2 * 86400000).toISOString(),
      qualifiedRoute: "Port Harcourt",
      isActive: false,
      rating: 3,
      vehiclePlateNumber: "GHI-789JK",
      address: "Lekki Gardens, Lagos",
      photo: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [{ type: "DRIVER_LICENSE", number: "CCC222-2" }],
    },
  ],
  "ikeja-motor-park": [
    {
      id: "d_ikej_1",
      parkId: "ikeja-motor-park",
      name: "Bola Adeyemi",
      phone: "+2348033333333",
      licenseNumber: "DDD333-3",
      licenseExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
      qualifiedRoute: "Kano",
      isActive: true,
      rating: 4,
      vehiclePlateNumber: "JKL-012MN",
      address: "Ikeja, Lagos",
      photo: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [{ type: "DRIVER_LICENSE", number: "DDD333-3" }],
    },
    {
      id: "d_ikej_2",
      parkId: "ikeja-motor-park",
      name: "Fatima Usman",
      phone: "+2348034444444",
      licenseNumber: "EEE444-4",
      licenseExpiry: new Date(Date.now() + 45 * 86400000).toISOString(),
      qualifiedRoute: "Ibadan",
      isActive: true,
      rating: 5,
      vehiclePlateNumber: "MNO-345PQ",
      address: "Ikeja GRA, Lagos",
      photo: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [{ type: "DRIVER_LICENSE", number: "EEE444-4" }],
    },
    {
      id: "d_ikej_3",
      parkId: "ikeja-motor-park",
      name: "Emeka Nwosu",
      phone: "+2348035555555",
      licenseNumber: "FFF555-5",
      licenseExpiry: new Date(Date.now() - 1 * 86400000).toISOString(),
      qualifiedRoute: "Abuja",
      isActive: true,
      rating: 3,
      vehiclePlateNumber: "RST-678UV",
      address: "Ojodu, Lagos",
      photo: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [{ type: "DRIVER_LICENSE", number: "FFF555-5" }],
    },
    {
      id: "d_ikej_4",
      parkId: "ikeja-motor-park",
      name: "Aisha Mohammed",
      phone: "+2348036666666",
      licenseNumber: "GGG666-6",
      licenseExpiry: new Date(Date.now() + 3 * 86400000).toISOString(),
      qualifiedRoute: "Port Harcourt",
      isActive: false,
      rating: 4,
      vehiclePlateNumber: "WXY-901ZA",
      address: "Alausa, Lagos",
      photo: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [{ type: "DRIVER_LICENSE", number: "GGG666-6" }],
    },
  ],
};

// Persist data globally for development
globalThis.__driversData = data;

export function resetDemoDrivers() {
  for (const k of Object.keys(data)) delete data[k];
}

export function createDriver(input: CreateDriverInput): Driver {
  const list = data[input.parkId] ?? (data[input.parkId] = []);
  if (list.some((d) => d.licenseNumber === input.licenseNumber)) {
    throw new Error(
      "Driver with this license number already exists in this park"
    );
  }
  const now = new Date().toISOString();
  const driver: Driver = {
    id: `driver_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    parkId: input.parkId,
    name: input.name,
    phone: input.phone,
    licenseNumber: input.licenseNumber,
    licenseExpiry: input.licenseExpiry,
    qualifiedRoute: input.qualifiedRoute,
    isActive: input.isActive,
    rating: input.rating,
    vehiclePlateNumber: input.vehiclePlateNumber,
    address: input.address,
    photo: input.photo,
    createdAt: now,
    updatedAt: now,
  };
  list.push(driver);
  return driver;
}

export function listDrivers(
  parkId: string,
  filters: DriverFilter = {},
  assignments: TripAssignment[] = [],
  page = 1,
  limit = 50
): PaginatedResponse<Driver> {
  const list = data[parkId] ?? [];
  const filtered = filterDrivers(list, filters, assignments);
  const total = filtered.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const slice = filtered.slice(start, end);
  return {
    data: slice,
    total,
    page,
    limit,
    hasNext: end < total,
    hasPrev: start > 0,
  };
}

export function updateDriver(
  id: string,
  input: Partial<CreateDriverInput>
): Driver {
  for (const parkId in data) {
    const list = data[parkId];
    const index = list.findIndex((d) => d.id === id);
    if (index !== -1) {
      const now = new Date().toISOString();
      const updated: Driver = {
        ...list[index],
        ...input,
        updatedAt: now,
      };
      list[index] = updated;
      return updated;
    }
  }
  throw new Error("Driver not found");
}

export function deleteDriver(id: string): void {
  for (const parkId in data) {
    const list = data[parkId];
    const index = list.findIndex((d) => d.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      return;
    }
  }
  throw new Error("Driver not found");
}

export function getDriver(id: string): Driver | null {
  for (const parkId in data) {
    const list = data[parkId];
    const driver = list.find((d) => d.id === id);
    if (driver) return driver;
  }
  return null;
}
