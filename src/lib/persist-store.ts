// Simple persistence helper for development
// This helps maintain data between page refreshes in development mode

const STORAGE_KEY = "movaa-dev-data";

export interface PersistedData {
  routes: Record<string, unknown[]>;
  drivers: Record<string, unknown[]>;
}

export function saveToStorage(data: PersistedData) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }
}

export function loadFromStorage(): PersistedData | null {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn("Failed to load from localStorage:", error);
      return null;
    }
  }
  return null;
}

export function clearStorage() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Development helper to manually add test data
export function addTestData() {
  const testData: PersistedData = {
    routes: {
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
          id: "route_1757670714380_kofmvf",
          parkId: "ikeja-motor-park",
          destination: "Akure",
          basePrice: 3000,
          vehicleCapacity: 14,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    },
    drivers: {
      "ikeja-motor-park": [
        {
          id: "driver_1757687612193_sc3woo",
          parkId: "ikeja-motor-park",
          name: "Femi Elujoba",
          phone: "+2348161165422",
          licenseNumber: "EEE444-4",
          licenseExpiry: new Date("2025-09-25").toISOString(),
          qualifiedRoute: "Akure",
          isActive: true,
          rating: 3,
          vehiclePlateNumber: "MNO-345PQ",
          address: "Lekki-Sangotedo, Ajah Lagos",
          photo: "https://www.example.com",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    },
  };

  saveToStorage(testData);
  console.log("Test data added to localStorage");
}
