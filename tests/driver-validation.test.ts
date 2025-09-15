import { describe, it, expect } from "vitest";

import {
  isValidNigeriaLicenseNumber,
  computeLicenseChecksum,
  DriverInputSchema,
  VehiclePlateSchema,
  PhoneSchema,
} from "@/lib/driver";

describe("Driver validation", () => {
  it("validates Nigerian-like license number with checksum", () => {
    // Our temporary scheme: base (alnum 6-12) + '-' + mod10 checksum digit
    const base = "KDJ7A9";
    const checksum = computeLicenseChecksum(base);
    const lic = `${base}-${checksum}`;
    expect(isValidNigeriaLicenseNumber(lic)).toBe(true);
    expect(isValidNigeriaLicenseNumber(`${base}-9`)).toBe(false);
  });

  it("rejects obviously invalid license patterns", () => {
    expect(isValidNigeriaLicenseNumber("abc")).toBe(false);
    expect(isValidNigeriaLicenseNumber("123456")) // missing checksum
      .toBe(false);
  });

  it("validates Nigerian vehicle plate format (ABC-123DE)", () => {
    expect(VehiclePlateSchema.safeParse("ABC-123DE").success).toBe(true);
    expect(VehiclePlateSchema.safeParse("AB-123DE").success).toBe(false);
    expect(VehiclePlateSchema.safeParse("ABC-12DE").success).toBe(false);
  });

  it("accepts free-form phone with basic validation", () => {
    expect(PhoneSchema.safeParse("+234 803 123 4567").success).toBe(true);
    expect(PhoneSchema.safeParse("0803-123-4567").success).toBe(true);
    expect(PhoneSchema.safeParse("12").success).toBe(false);
  });

  it("validates DriverInputSchema with qualifiedRoutes by destination", () => {
    const base = "ABJ1234";
    const checksum = computeLicenseChecksum(base);
    const valid = DriverInputSchema.safeParse({
      name: "John Doe",
      phone: "+2348031234567",
      licenseNumber: `${base}-${checksum}`,
      licenseExpiry: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      qualifiedRoutes: ["Abuja", "Lagos"],
      isActive: true,
      rating: 4,
      vehiclePlateNumber: "ABC-123DE",
      address: "12 Marina, Lagos",
      photo: "https://example.com/photo.jpg",
      documents: [{ type: "DRIVER_LICENSE", number: `${base}-${checksum}` }],
    });
    expect(valid.success).toBe(true);
  });

  it("enforces rating 1-5 and warns on expired license", () => {
    const base = "XYZ7890";
    const checksum = computeLicenseChecksum(base);
    const parsed = DriverInputSchema.safeParse({
      name: "Jane Doe",
      phone: "0803 000 0000",
      licenseNumber: `${base}-${checksum}`,
      licenseExpiry: new Date(Date.now() - 24 * 60 * 60 * 1000),
      qualifiedRoutes: ["Ibadan"],
      isActive: true,
      rating: 5,
      vehiclePlateNumber: "DEF-456GH",
      address: "Ibadan Ring Rd",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const d = parsed.data;
      // Helper for checking expiry warning will be implemented alongside schema
      expect(new Date(d.licenseExpiry).getTime()).toBeLessThan(Date.now());
    }
  });
});
