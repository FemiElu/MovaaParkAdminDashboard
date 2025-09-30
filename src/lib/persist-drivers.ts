// Enhanced persistence for drivers data
// This provides better persistence across server restarts

import { Driver } from "@/types";

// Enhanced storage with better persistence
export function saveDriversToStorage(parkId: string, drivers: Driver[]) {
  if (typeof window !== "undefined") {
    // Client-side: Use localStorage
    localStorage.setItem(`drivers_${parkId}`, JSON.stringify(drivers));
  } else {
    // Server-side: Use a more persistent approach
    try {
      // Try to use a file-based approach or enhanced global storage
      if (typeof globalThis !== "undefined") {
        globalThis.__driversData = globalThis.__driversData || {};
        globalThis.__driversData[parkId] = drivers;

        // Also try to persist to a more stable location
        if (
          typeof process !== "undefined" &&
          process.env.NODE_ENV === "development"
        ) {
          // In development, we can use a simple file-based approach
          const fs = require("fs");
          const path = require("path");
          const dataDir = path.join(process.cwd(), ".next", "cache");

          try {
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            const filePath = path.join(dataDir, "drivers-data.json");
            const allData = globalThis.__driversData || {};
            fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
          } catch (fileError) {
            console.warn("Could not persist drivers data to file:", fileError);
          }
        }
      }
    } catch (error) {
      console.warn("Could not persist drivers data:", error);
    }
  }
}

export function loadDriversFromStorage(parkId: string): Driver[] {
  if (typeof window !== "undefined") {
    // Client-side: Load from localStorage
    try {
      const stored = localStorage.getItem(`drivers_${parkId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Could not load drivers from localStorage:", error);
      return [];
    }
  } else {
    // Server-side: Load from global storage
    try {
      if (typeof globalThis !== "undefined" && globalThis.__driversData) {
        return globalThis.__driversData[parkId] || [];
      }

      // Try to load from file in development
      if (
        typeof process !== "undefined" &&
        process.env.NODE_ENV === "development"
      ) {
        const fs = require("fs");
        const path = require("path");
        const filePath = path.join(
          process.cwd(),
          ".next",
          "cache",
          "drivers-data.json"
        );

        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, "utf8");
          const allData = JSON.parse(fileData);
          globalThis.__driversData = allData;
          return allData[parkId] || [];
        }
      }
    } catch (error) {
      console.warn("Could not load drivers from storage:", error);
    }

    return [];
  }
}

// Enhanced driver store with better persistence
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

  // Also update global storage for immediate access
  if (typeof globalThis !== "undefined") {
    globalThis.__driversData = globalThis.__driversData || {};
    globalThis.__driversData[input.parkId] = updatedDrivers;
  }

  return driver;
}

export function getDriverWithPersistence(id: string): Driver | null {
  // First try global storage
  if (typeof globalThis !== "undefined" && globalThis.__driversData) {
    for (const parkId in globalThis.__driversData) {
      const driver = globalThis.__driversData[parkId].find(
        (d: Driver) => d.id === id
      );
      if (driver) return driver;
    }
  }

  // If not found, try loading from persistent storage
  // This is a fallback for when global storage is not available
  try {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(
      process.cwd(),
      ".next",
      "cache",
      "drivers-data.json"
    );

    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf8");
      const allData = JSON.parse(fileData);

      for (const parkId in allData) {
        const driver = allData[parkId].find((d: Driver) => d.id === id);
        if (driver) return driver;
      }
    }
  } catch (error) {
    console.warn("Could not load driver from persistent storage:", error);
  }

  return null;
}
