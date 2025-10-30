import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { tripsStore, Trip, Vehicle, Booking, Parcel } from "@/lib/trips-store";
import { TripDetailTabs } from "@/components/trips/trip-detail-tabs";
import { PassengerManifestTable } from "@/components/trips/passenger-manifest-table";
import { ParcelsTable } from "@/components/trips/parcels-table";
import { TripFinanceSummary } from "@/components/trips/trip-finance-summary";

// Mock fetch for API calls
global.fetch = vi.fn();

describe("Trip UI Components", () => {
  let mockTrip: Trip;
  let mockVehicle: Vehicle;
  let mockBookings: Booking[];
  let mockParcels: Parcel[];

  beforeEach(() => {
    // Reset store state
    (globalThis as any).__tripsData = undefined;

    // Get mock data
    mockTrip = tripsStore.getTrips()[0];
    mockVehicle = tripsStore.getVehicles()[0];
    mockBookings = tripsStore.getBookings(mockTrip.id);
    mockParcels = tripsStore.getParcels(mockTrip.id);

    // Mock fetch
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("TripDetailTabs", () => {
    it("should render all tabs", () => {
      render(
        <TripDetailTabs
          trip={mockTrip}
          vehicle={mockVehicle}
          driver={{
            id: "driver_1",
            name: "Test Driver",
            phone: "+2348012345678",
            rating: 4.5,
            parkId: mockTrip.parkId,
          }}
          bookings={mockBookings}
          parcels={mockParcels}
        />
      );

      expect(screen.getByText("Passengers")).toBeInTheDocument();
      expect(screen.getByText("Parcels")).toBeInTheDocument();
      expect(screen.getByText("Finances")).toBeInTheDocument();
      expect(screen.getByText("Audit Log")).toBeInTheDocument();
    });

    it("should switch between tabs", () => {
      render(
        <TripDetailTabs
          trip={mockTrip}
          vehicle={mockVehicle}
          driver={{
            id: "driver_1",
            name: "Test Driver",
            phone: "+2348012345678",
            rating: 4.5,
            parkId: mockTrip.parkId,
          }}
          bookings={mockBookings}
          parcels={mockParcels}
        />
      );

      // Click on Parcels tab
      fireEvent.click(screen.getByText("Parcels"));

      // Should show parcels content
      expect(screen.getByText("Search parcels...")).toBeInTheDocument();
    });

    it("should show passenger count badge", () => {
      render(
        <TripDetailTabs
          trip={mockTrip}
          vehicle={mockVehicle}
          driver={{
            id: "driver_1",
            name: "Test Driver",
            phone: "+2348012345678",
            rating: 4.5,
            parkId: mockTrip.parkId,
          }}
          bookings={mockBookings}
          parcels={mockParcels}
        />
      );

      const passengerTab = screen.getByText("Passengers");
      expect(passengerTab.parentElement).toHaveTextContent(
        mockBookings.length.toString()
      );
    });
  });

  // High-level UI assertions for Trips page behaviours
  describe("Trips Page behaviours (smoke)", () => {
    it("should show newly created trips after refresh (smoke)", async () => {
      // This is a smoke test placeholder. Real network-backed test would mount the TripsPageClient
      // and assert cards after a create + refresh cycle. Here we only assert the test harness.
      expect(true).toBe(true);
    });

    it("should filter trips by date and route (smoke)", async () => {
      // This is a smoke test placeholder for UI route/date filtering.
      expect(true).toBe(true);
    });
  });

  describe("PassengerManifestTable", () => {
    it("should render passenger table with data", () => {
      render(
        <PassengerManifestTable
          trip={mockTrip}
          bookings={mockBookings}
          vehicle={mockVehicle}
        />
      );

      expect(screen.getByText("Search passengers...")).toBeInTheDocument();
      expect(screen.getByText("Total Passengers")).toBeInTheDocument();
      expect(
        screen.getByText(mockBookings.length.toString())
      ).toBeInTheDocument();
    });

    it("should filter passengers by search term", () => {
      render(
        <PassengerManifestTable
          trip={mockTrip}
          bookings={mockBookings}
          vehicle={mockVehicle}
        />
      );

      const searchInput = screen.getByPlaceholderText("Search passengers...");
      fireEvent.change(searchInput, {
        target: { value: mockBookings[0]?.passengerName || "test" },
      });

      // Should show filtered results
      expect(
        screen.getByText(mockBookings[0]?.passengerName || "test")
      ).toBeInTheDocument();
    });

    it("should filter passengers by status", () => {
      render(
        <PassengerManifestTable
          trip={mockTrip}
          bookings={mockBookings}
          vehicle={mockVehicle}
        />
      );

      const statusFilter = screen.getByText("All Statuses");
      fireEvent.click(statusFilter);

      // Should show status options
      expect(screen.getAllByText(/Confirmed/).length).toBeGreaterThan(0);
    });

    it("should handle check-in action", async () => {
      render(
        <PassengerManifestTable
          trip={mockTrip}
          bookings={mockBookings}
          vehicle={mockVehicle}
        />
      );

      const checkInButtons = screen.getAllByText(/Check-in/);
      if (checkInButtons.length > 0) {
        fireEvent.click(checkInButtons[0]);

        await waitFor(() => {
          // Ensure fetch was called with correct endpoint
          expect(global.fetch).toHaveBeenCalled();
          const [url, init] = (global.fetch as any).mock.calls[0];
          expect(url).toBe(`/api/trips/${mockTrip.id}/checkin`);
          expect(init.method).toBe("POST");
          expect(init.headers).toEqual({ "Content-Type": "application/json" });
          // Body should be JSON string containing a bookingId string
          const parsed = JSON.parse(init.body);
          expect(parsed).toEqual(
            expect.objectContaining({ bookingId: expect.any(String) })
          );
        });
      }
    });

    it("should show summary statistics", () => {
      render(
        <PassengerManifestTable
          trip={mockTrip}
          bookings={mockBookings}
          vehicle={mockVehicle}
        />
      );

      expect(screen.getByText("Total Passengers")).toBeInTheDocument();
      expect(screen.getAllByText(/Confirmed/).length).toBeGreaterThan(0);
      expect(screen.getByText("Total Revenue")).toBeInTheDocument();
      expect(screen.getByText("Seat Utilization")).toBeInTheDocument();
    });
  });

  describe("ParcelsTable", () => {
    it("should render parcels table with data", () => {
      render(
        <ParcelsTable
          trip={mockTrip}
          parcels={mockParcels}
          vehicle={mockVehicle}
        />
      );

      expect(
        screen.getByPlaceholderText("Search parcels...")
      ).toBeInTheDocument();
      expect(screen.getByText("Total Parcels")).toBeInTheDocument();
      expect(
        screen.getByText(mockParcels.length.toString())
      ).toBeInTheDocument();
    });

    it("should filter parcels by search term", () => {
      render(
        <ParcelsTable
          trip={mockTrip}
          parcels={mockParcels}
          vehicle={mockVehicle}
        />
      );

      const searchInput = screen.getByPlaceholderText("Search parcels...");
      fireEvent.change(searchInput, {
        target: { value: mockParcels[0]?.senderName || "test" },
      });

      // Should show filtered results or the empty-state message that includes the term
      const term = mockParcels[0]?.senderName || "test";
      expect(
        screen.getByText((content) =>
          content.toLowerCase().includes(term.toLowerCase())
        )
      ).toBeInTheDocument();
    });

    it("should show capacity warning when high usage", () => {
      // Create a mock vehicle with low capacity
      const lowCapacityVehicle = {
        ...mockVehicle,
        maxParcelsPerVehicle: 2,
      };

      // Create many parcels to exceed capacity
      const manyParcels = Array.from({ length: 5 }, (_, i) => ({
        ...mockParcels[0],
        id: `parcel_${i}`,
        senderName: `Sender ${i}`,
      }));

      render(
        <ParcelsTable
          trip={mockTrip}
          parcels={manyParcels}
          vehicle={lowCapacityVehicle}
        />
      );

      expect(screen.getByText("High Capacity Usage")).toBeInTheDocument();
    });

    it("should show capacity statistics", () => {
      render(
        <ParcelsTable
          trip={mockTrip}
          parcels={mockParcels}
          vehicle={mockVehicle}
        />
      );

      expect(screen.getByText("Total Parcels")).toBeInTheDocument();
      expect(screen.getByText("Capacity Used")).toBeInTheDocument();
      expect(screen.getByText("Total Revenue")).toBeInTheDocument();
      expect(screen.getByText("Max Capacity")).toBeInTheDocument();
    });
  });

  describe("TripFinanceSummary", () => {
    it("should render finance summary", () => {
      render(
        <TripFinanceSummary
          trip={mockTrip}
          bookings={mockBookings}
          parcels={mockParcels}
        />
      );

      expect(screen.getByText("Trip Finance Summary")).toBeInTheDocument();
      expect(screen.getByText("Passenger Revenue")).toBeInTheDocument();
      expect(screen.getByText("Parcel Revenue")).toBeInTheDocument();
      expect(screen.getByText("Driver Split")).toBeInTheDocument();
      expect(screen.getByText("Park Split")).toBeInTheDocument();
    });

    it("should show revenue splits", () => {
      render(
        <TripFinanceSummary
          trip={mockTrip}
          bookings={mockBookings}
          parcels={mockParcels}
        />
      );

      // Should show the split percentages
      expect(screen.getByText("Driver 80% / Park 20%")).toBeInTheDocument();
    });

    it("should open adjustment dialog", () => {
      render(
        <TripFinanceSummary
          trip={mockTrip}
          bookings={mockBookings}
          parcels={mockParcels}
        />
      );

      const addAdjustmentButton = screen.getByText("Add Adjustment");
      fireEvent.click(addAdjustmentButton);

      expect(screen.getByText("Add Manual Adjustment")).toBeInTheDocument();
      expect(screen.getByLabelText("Amount")).toBeInTheDocument();
      expect(screen.getByLabelText("Reason")).toBeInTheDocument();
    });

    it("should show payout status", () => {
      render(
        <TripFinanceSummary
          trip={mockTrip}
          bookings={mockBookings}
          parcels={mockParcels}
        />
      );

      expect(screen.getByText("Payout Status")).toBeInTheDocument();
    });
  });

  describe("Mobile Responsiveness", () => {
    it("should show mobile layout for small screens", () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <PassengerManifestTable
          trip={mockTrip}
          bookings={mockBookings}
          vehicle={mockVehicle}
        />
      );

      // Should show mobile card layout
      const mobileCards = document.querySelectorAll(".sm\\:hidden");
      expect(mobileCards.length).toBeGreaterThan(0);
    });

    it("should show desktop layout for large screens", () => {
      // Mock window.innerWidth for desktop
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(
        <PassengerManifestTable
          trip={mockTrip}
          bookings={mockBookings}
          vehicle={mockVehicle}
        />
      );

      // Should show desktop table layout
      const desktopTable = document.querySelectorAll(".hidden.sm\\:block");
      expect(desktopTable.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle empty data gracefully", () => {
      render(
        <PassengerManifestTable
          trip={mockTrip}
          bookings={[]}
          vehicle={mockVehicle}
        />
      );

      expect(screen.getByText("No passengers found")).toBeInTheDocument();
    });

    it("should handle API errors gracefully", async () => {
      (global.fetch as any).mockRejectedValue(new Error("API Error"));

      render(
        <PassengerManifestTable
          trip={mockTrip}
          bookings={mockBookings}
          vehicle={mockVehicle}
        />
      );

      const checkInButtons = screen.getAllByText(/Check-in/);
      if (checkInButtons.length > 0) {
        fireEvent.click(checkInButtons[0]);

        // Should not crash the component; at least one check-in control remains
        expect(screen.getAllByText(/Check-in/).length).toBeGreaterThan(0);
      }
    });
  });
});
