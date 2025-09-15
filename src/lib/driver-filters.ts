import { type Driver, type TripAssignment } from "@/types";

export type LicenseStatus = "valid" | "expired" | "unknown";

export function getLicenseStatus(driver: Driver): LicenseStatus {
  if (!driver.licenseExpiry) return "unknown";
  const ts = new Date(driver.licenseExpiry).getTime();
  if (Number.isNaN(ts)) return "unknown";
  return ts >= Date.now() ? "valid" : "expired";
}

export function isDriverAvailable(
  driver: Driver,
  assignments: TripAssignment[],
  date: Date
): boolean {
  const d0 = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
  return !assignments.some(
    (a) =>
      a.driverId === driver.id &&
      new Date(a.tripDate).setHours(0, 0, 0, 0) === d0
  );
}

export interface DriverFilter {
  destination?: string; // RouteConfig.destination
  status?: "active" | "inactive";
  minRating?: number;
  license?: LicenseStatus; // valid | expired | unknown
  availability?: "available" | "unavailable";
  date?: Date;
}

export function filterDrivers(
  drivers: Driver[],
  filters: DriverFilter,
  assignments: TripAssignment[] = []
): Driver[] {
  return drivers.filter((d) => {
    if (filters.destination && d.qualifiedRoute !== filters.destination)
      return false;
    if (filters.status === "active" && !d.isActive) return false;
    if (filters.status === "inactive" && d.isActive) return false;
    if (
      typeof filters.minRating === "number" &&
      (d.rating ?? 0) < filters.minRating
    )
      return false;

    if (filters.license) {
      if (getLicenseStatus(d) !== filters.license) return false;
    }

    if (filters.availability) {
      const date = filters.date ?? new Date();
      const available = isDriverAvailable(d, assignments, date);
      if (filters.availability === "available" && !available) return false;
      if (filters.availability === "unavailable" && available) return false;
    }

    return true;
  });
}
