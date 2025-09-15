import { describe, it, expect, beforeEach } from "vitest";
import {
  createDriver,
  updateDriver,
  deleteDriver,
  getDriver,
  resetDemoDrivers,
} from "@/lib/drivers-store";
import { CreateDriverInput } from "@/lib/drivers-store";

describe("Driver CRUD Operations", () => {
  beforeEach(() => {
    resetDemoDrivers();
  });

  describe("createDriver", () => {
    it("should create a new driver successfully", () => {
      const input: CreateDriverInput = {
        parkId: "test-park",
        name: "John Doe",
        phone: "+2348031234567",
        licenseNumber: "ABC123-4",
        licenseExpiry: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        qualifiedRoute: "Lagos",
        isActive: true,
        rating: 4,
        vehiclePlateNumber: "ABC-123DE",
        address: "123 Test Street",
      };

      const driver = createDriver(input);

      expect(driver).toBeDefined();
      expect(driver.id).toBeDefined();
      expect(driver.name).toBe(input.name);
      expect(driver.phone).toBe(input.phone);
      expect(driver.licenseNumber).toBe(input.licenseNumber);
      expect(driver.qualifiedRoute).toBe(input.qualifiedRoute);
      expect(driver.isActive).toBe(input.isActive);
      expect(driver.rating).toBe(input.rating);
      expect(driver.vehiclePlateNumber).toBe(input.vehiclePlateNumber);
      expect(driver.address).toBe(input.address);
      expect(driver.parkId).toBe(input.parkId);
      expect(driver.createdAt).toBeDefined();
      expect(driver.updatedAt).toBeDefined();
    });

    it("should enforce unique license numbers per park", () => {
      const input1: CreateDriverInput = {
        parkId: "test-park",
        name: "John Doe",
        phone: "+2348031234567",
        licenseNumber: "ABC123-4",
        licenseExpiry: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        qualifiedRoute: "Lagos",
        isActive: true,
      };

      const input2: CreateDriverInput = {
        parkId: "test-park",
        name: "Jane Doe",
        phone: "+2348031234568",
        licenseNumber: "ABC123-4", // Same license number
        licenseExpiry: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        qualifiedRoute: "Abuja",
        isActive: true,
      };

      createDriver(input1);
      expect(() => createDriver(input2)).toThrow("already exists");
    });

    it("should allow same license number in different parks", () => {
      const input1: CreateDriverInput = {
        parkId: "park-1",
        name: "John Doe",
        phone: "+2348031234567",
        licenseNumber: "ABC123-4",
        licenseExpiry: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        qualifiedRoute: "Lagos",
        isActive: true,
      };

      const input2: CreateDriverInput = {
        parkId: "park-2",
        name: "Jane Doe",
        phone: "+2348031234568",
        licenseNumber: "ABC123-4", // Same license number, different park
        licenseExpiry: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        qualifiedRoute: "Abuja",
        isActive: true,
      };

      const driver1 = createDriver(input1);
      const driver2 = createDriver(input2);

      expect(driver1.id).not.toBe(driver2.id);
      expect(driver1.parkId).toBe("park-1");
      expect(driver2.parkId).toBe("park-2");
    });
  });

  describe("updateDriver", () => {
    it("should update an existing driver", async () => {
      const input: CreateDriverInput = {
        parkId: "test-park",
        name: "John Doe",
        phone: "+2348031234567",
        licenseNumber: "ABC123-4",
        licenseExpiry: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        qualifiedRoute: "Lagos",
        isActive: true,
        rating: 4,
      };

      const driver = createDriver(input);
      const originalUpdatedAt = driver.updatedAt;

      // Add small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 2));

      const updatedDriver = updateDriver(driver.id, {
        name: "John Smith",
        rating: 5,
        isActive: false,
      });

      expect(updatedDriver.id).toBe(driver.id);
      expect(updatedDriver.name).toBe("John Smith");
      expect(updatedDriver.rating).toBe(5);
      expect(updatedDriver.isActive).toBe(false);
      expect(updatedDriver.phone).toBe(driver.phone); // Unchanged
      expect(updatedDriver.licenseNumber).toBe(driver.licenseNumber); // Unchanged
      expect(updatedDriver.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(updatedDriver.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );
    });

    it("should throw error for non-existent driver", () => {
      expect(() =>
        updateDriver("non-existent-id", { name: "New Name" })
      ).toThrow("Driver not found");
    });
  });

  describe("deleteDriver", () => {
    it("should delete an existing driver", () => {
      const input: CreateDriverInput = {
        parkId: "test-park",
        name: "John Doe",
        phone: "+2348031234567",
        licenseNumber: "ABC123-4",
        licenseExpiry: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        qualifiedRoute: "Lagos",
        isActive: true,
      };

      const driver = createDriver(input);
      const driverId = driver.id;

      // Verify driver exists
      expect(getDriver(driverId)).toBeDefined();

      // Delete driver
      deleteDriver(driverId);

      // Verify driver is deleted
      expect(getDriver(driverId)).toBeNull();
    });

    it("should throw error for non-existent driver", () => {
      expect(() => deleteDriver("non-existent-id")).toThrow("Driver not found");
    });
  });

  describe("getDriver", () => {
    it("should return driver by id", () => {
      const input: CreateDriverInput = {
        parkId: "test-park",
        name: "John Doe",
        phone: "+2348031234567",
        licenseNumber: "ABC123-4",
        licenseExpiry: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        qualifiedRoute: "Lagos",
        isActive: true,
      };

      const driver = createDriver(input);
      const foundDriver = getDriver(driver.id);

      expect(foundDriver).toBeDefined();
      expect(foundDriver?.id).toBe(driver.id);
      expect(foundDriver?.name).toBe(driver.name);
    });

    it("should return null for non-existent driver", () => {
      expect(getDriver("non-existent-id")).toBeNull();
    });
  });
});
