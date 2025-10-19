// Client-safe driver storage utilities
// This version only works in the browser and doesn't import Node.js modules

import { Driver } from "@/types";

/**
 * Load drivers from localStorage (client-side only)
 */
export function loadDriversFromStorage(parkId: string): Driver[] {
  if (typeof window === "undefined") {
    // Server-side: return empty array
    return [];
  }

  try {
    const stored = localStorage.getItem(`drivers_${parkId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("Could not load drivers from localStorage:", error);
    return [];
  }
}

/**
 * Save drivers to localStorage (client-side only)
 */
export function saveDriversToStorage(parkId: string, drivers: Driver[]): void {
  if (typeof window === "undefined") {
    // Server-side: do nothing
    return;
  }

  try {
    localStorage.setItem(`drivers_${parkId}`, JSON.stringify(drivers));
  } catch (error) {
    console.warn("Could not save drivers to localStorage:", error);
  }
}

/**
 * Create a driver with persistence (client-side only)
 */
export function createDriverWithPersistence(input: {
  parkId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  qualifiedRoute: string;
  isActive: boolean;
  vehiclePlateNumber?: string;
  address?: string;
}): Driver {
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
    rating: 5, // Default rating
    vehiclePlateNumber: input.vehiclePlateNumber,
    address: input.address,
    createdAt: now,
    updatedAt: now,
  };

  // Get existing drivers
  const existingDrivers = loadDriversFromStorage(input.parkId);

  // Check for duplicate license number
  if (existingDrivers.some((d) => d.licenseNumber === input.licenseNumber)) {
    throw new Error(
      "Driver with this license number already exists in this park"
    );
  }

  // Add new driver
  const updatedDrivers = [...existingDrivers, driver];

  // Save back to storage
  saveDriversToStorage(input.parkId, updatedDrivers);

  return driver;
}

/**
 * Get a driver by ID from localStorage
 */
export function getDriverWithPersistence(id: string): Driver | null {
  if (typeof window === "undefined") {
    return null;
  }

  // Search through all park driver storages
  const keys = Object.keys(localStorage);
  const driverKeys = keys.filter((key) => key.startsWith("drivers_"));

  for (const key of driverKeys) {
    try {
      const drivers = JSON.parse(localStorage.getItem(key) || "[]");
      const driver = drivers.find((d: Driver) => d.id === id);
      if (driver) return driver;
    } catch (error) {
      console.warn(`Could not parse drivers from ${key}:`, error);
    }
  }

  return null;
}
