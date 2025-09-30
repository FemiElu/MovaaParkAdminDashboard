// Database service layer for drivers
// This replaces the in-memory storage with proper database operations

import { Driver } from "@/types";

// This would be your actual database connection
// For now, we'll create a mock that simulates database operations
// In production, replace this with actual database calls (Prisma, TypeORM, etc.)

interface DatabaseDriver {
  id: string;
  park_id: string;
  name: string;
  phone: string;
  license_number: string;
  license_expiry: string;
  qualified_route: string;
  is_active: boolean;
  rating: number;
  vehicle_plate_number?: string;
  address?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

// Mock database operations - replace with actual database calls
class DatabaseService {
  private drivers: DatabaseDriver[] = [];
  private routes: Array<{
    id: string;
    park_id: string;
    destination: string;
    base_price: number;
  }> = [];

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Initialize with sample data
    this.drivers = [
      {
        id: "d_lekk_1",
        park_id: "lekki-phase-1-motor-park",
        name: "Adewale Ibrahim",
        phone: "+2348030000000",
        license_number: "AKW06968AA2",
        license_expiry: new Date(Date.now() + 30 * 86400000).toISOString(),
        qualified_route: "Lagos",
        is_active: true,
        rating: 5.0,
        vehicle_plate_number: "ABC-123DE",
        address: "Lekki Phase 1, Lagos",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      // Add more sample drivers...
    ];

    this.routes = [
      {
        id: "r_lekk_1",
        park_id: "lekki-phase-1-motor-park",
        destination: "Lagos",
        base_price: 5000,
      },
      {
        id: "r_lekk_2",
        park_id: "lekki-phase-1-motor-park",
        destination: "Abuja",
        base_price: 15000,
      },
      // Add more sample routes...
    ];
  }

  // Driver operations
  async createDriver(
    driverData: Omit<DatabaseDriver, "id" | "created_at" | "updated_at">
  ): Promise<DatabaseDriver> {
    // Check for duplicate license number
    const existingDriver = this.drivers.find(
      (d) =>
        d.park_id === driverData.park_id &&
        d.license_number === driverData.license_number
    );

    if (existingDriver) {
      throw new Error(
        "Driver with this license number already exists in this park"
      );
    }

    const now = new Date().toISOString();
    const newDriver: DatabaseDriver = {
      id: `driver_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...driverData,
      created_at: now,
      updated_at: now,
    };

    this.drivers.push(newDriver);
    return newDriver;
  }

  async getDriverById(id: string): Promise<DatabaseDriver | null> {
    return this.drivers.find((d) => d.id === id) || null;
  }

  async getDriversByPark(
    parkId: string,
    filters: {
      destination?: string;
      status?: "active" | "inactive";
      minRating?: number;
      license?: "valid" | "expired" | "unknown";
    } = {}
  ): Promise<DatabaseDriver[]> {
    let filteredDrivers = this.drivers.filter((d) => d.park_id === parkId);

    // Apply filters
    if (filters.destination) {
      filteredDrivers = filteredDrivers.filter(
        (d) => d.qualified_route === filters.destination
      );
    }

    if (filters.status) {
      const isActive = filters.status === "active";
      filteredDrivers = filteredDrivers.filter((d) => d.is_active === isActive);
    }

    if (filters.minRating) {
      filteredDrivers = filteredDrivers.filter(
        (d) => d.rating >= filters.minRating!
      );
    }

    if (filters.license) {
      const now = new Date();
      filteredDrivers = filteredDrivers.filter((d) => {
        const expiry = new Date(d.license_expiry);
        switch (filters.license) {
          case "valid":
            return expiry > now;
          case "expired":
            return expiry <= now;
          case "unknown":
            return !d.license_expiry;
          default:
            return true;
        }
      });
    }

    return filteredDrivers;
  }

  async updateDriver(
    id: string,
    updates: Partial<Omit<DatabaseDriver, "id" | "created_at" | "updated_at">>
  ): Promise<DatabaseDriver | null> {
    const driverIndex = this.drivers.findIndex((d) => d.id === id);
    if (driverIndex === -1) return null;

    this.drivers[driverIndex] = {
      ...this.drivers[driverIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    return this.drivers[driverIndex];
  }

  async deleteDriver(id: string): Promise<boolean> {
    const driverIndex = this.drivers.findIndex((d) => d.id === id);
    if (driverIndex === -1) return false;

    this.drivers.splice(driverIndex, 1);
    return true;
  }

  // Route operations
  async getRoutesByPark(parkId: string): Promise<
    Array<{
      id: string;
      park_id: string;
      destination: string;
      base_price: number;
    }>
  > {
    return this.routes.filter((r) => r.park_id === parkId);
  }
}

// Singleton instance
const dbService = new DatabaseService();

// Convert database driver to application driver
function dbDriverToDriver(dbDriver: DatabaseDriver): Driver {
  return {
    id: dbDriver.id,
    parkId: dbDriver.park_id,
    name: dbDriver.name,
    phone: dbDriver.phone,
    licenseNumber: dbDriver.license_number,
    licenseExpiry: dbDriver.license_expiry,
    qualifiedRoute: dbDriver.qualified_route,
    isActive: dbDriver.is_active,
    rating: dbDriver.rating,
    vehiclePlateNumber: dbDriver.vehicle_plate_number,
    address: dbDriver.address,
    photo: dbDriver.photo_url,
    createdAt: dbDriver.created_at,
    updatedAt: dbDriver.updated_at,
  };
}

// Public API functions that replace the in-memory store functions
export async function createDriver(input: {
  parkId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  qualifiedRoute: string;
  isActive: boolean;
  vehiclePlateNumber?: string;
  address?: string;
}): Promise<Driver> {
  const dbDriver = await dbService.createDriver({
    park_id: input.parkId,
    name: input.name,
    phone: input.phone,
    license_number: input.licenseNumber,
    license_expiry: input.licenseExpiry,
    qualified_route: input.qualifiedRoute,
    is_active: input.isActive,
    rating: 5, // Default rating for new drivers
    vehicle_plate_number: input.vehiclePlateNumber,
    address: input.address,
  });

  return dbDriverToDriver(dbDriver);
}

export async function getDriver(id: string): Promise<Driver | null> {
  const dbDriver = await dbService.getDriverById(id);
  return dbDriver ? dbDriverToDriver(dbDriver) : null;
}

export async function listDrivers(
  parkId: string,
  filters: {
    destination?: string;
    status?: "active" | "inactive";
    minRating?: number;
    license?: "valid" | "expired" | "unknown";
  } = {},
  page = 1,
  limit = 50
): Promise<{
  data: Driver[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}> {
  const allDrivers = await dbService.getDriversByPark(parkId, filters);
  const total = allDrivers.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const slice = allDrivers.slice(start, end);

  return {
    data: slice.map(dbDriverToDriver),
    total,
    page,
    limit,
    hasNext: end < total,
    hasPrev: start > 0,
  };
}

export async function updateDriver(
  id: string,
  input: {
    name?: string;
    phone?: string;
    licenseNumber?: string;
    licenseExpiry?: string;
    qualifiedRoute?: string;
    isActive?: boolean;
    vehiclePlateNumber?: string;
    address?: string;
  }
): Promise<Driver> {
  const dbDriver = await dbService.updateDriver(id, {
    name: input.name,
    phone: input.phone,
    license_number: input.licenseNumber,
    license_expiry: input.licenseExpiry,
    qualified_route: input.qualifiedRoute,
    is_active: input.isActive,
    vehicle_plate_number: input.vehiclePlateNumber,
    address: input.address,
  });

  if (!dbDriver) {
    throw new Error("Driver not found");
  }

  return dbDriverToDriver(dbDriver);
}

export async function deleteDriver(id: string): Promise<boolean> {
  return await dbService.deleteDriver(id);
}

// Routes functions
export async function getRoutesByPark(
  parkId: string
): Promise<Array<{ id: string; destination: string; basePrice: number }>> {
  const routes = await dbService.getRoutesByPark(parkId);
  return routes.map((r) => ({
    id: r.id,
    destination: r.destination,
    basePrice: r.base_price,
  }));
}
