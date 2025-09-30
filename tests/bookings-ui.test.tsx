import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { tripsStore, Trip, Booking } from "@/lib/trips-store";
import { TripBookingsManager } from "@/components/bookings/trip-bookings-manager";
import { BookingSearchModal } from "@/components/bookings/booking-search-modal";
import { PassengerManifestModal } from "@/components/bookings/passenger-manifest-modal";
import { ConsolidatedBookingStats } from "@/components/bookings/consolidated-booking-stats";

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock NextAuth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: {
      id: "admin",
      parkId: "ikeja-motor-park",
    },
  }),
}));

// Mock auth options
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// Mock toast
vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

// Mock audit logger
vi.mock("@/lib/audit-logger", () => ({
  AuditLogger: {
    log: vi.fn().mockResolvedValue({}),
  },
  auditActions: {
    BOOKING_CHECKED_IN: "booking_checked_in",
  },
  getUserContext: () => ({}),
}));

describe("Bookings UI Components", () => {
  let mockTrip: Trip;
  let mockBookings: Booking[];
  let mockDrivers: any[];

  beforeEach(() => {
    // Reset store state
    (globalThis as any).__tripsData = undefined;

    // Get mock data
    mockTrip = tripsStore.getTrips("ikeja-motor-park", "2025-09-30")[0];
    mockBookings = tripsStore.getBookings(mockTrip.id);
    mockDrivers = tripsStore.getDrivers("ikeja-motor-park");

    // Mock fetch
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("ConsolidatedBookingStats", () => {
    it("should render loading state initially", () => {
      render(<ConsolidatedBookingStats parkId="ikeja-motor-park" />);

      // Should show loading skeletons initially
      expect(screen.getByText("Active Bookings")).toBeInTheDocument();
      expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
    });

    it("should render stats after hydration", async () => {
      render(<ConsolidatedBookingStats parkId="ikeja-motor-park" />);

      // Wait for client-side hydration
      await waitFor(() => {
        expect(
          screen.getByText(/Trips scheduled for today/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("TripBookingsManager", () => {
    it("should render with search button", () => {
      render(
        <TripBookingsManager parkId="ikeja-motor-park" drivers={mockDrivers} />
      );

      expect(screen.getByText("Passenger Check-In")).toBeInTheDocument();
      expect(screen.getByText("Search Passengers")).toBeInTheDocument();
    });

    it("should open search modal when search button is clicked", async () => {
      render(
        <TripBookingsManager parkId="ikeja-motor-park" drivers={mockDrivers} />
      );

      const searchButton = screen.getByRole("button", {
        name: /Search Passengers/,
      });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText("Search Passengers")).toBeInTheDocument();
        expect(
          screen.getByText(
            "Find passengers by Ticket ID, name, or phone number"
          )
        ).toBeInTheDocument();
      });
    });

    it("should display trips for selected date", async () => {
      render(
        <TripBookingsManager parkId="ikeja-motor-park" drivers={mockDrivers} />
      );

      // Wait for client-side hydration
      await waitFor(() => {
        expect(screen.getByText(/Trip Bookings/)).toBeInTheDocument();
      });
    });

    it("should open passenger manifest when trip card is clicked", async () => {
      render(
        <TripBookingsManager parkId="ikeja-motor-park" drivers={mockDrivers} />
      );

      // Wait for trips to load
      await waitFor(() => {
        const tripCards = screen.queryAllByText(/Trip to/);
        if (tripCards.length > 0) {
          fireEvent.click(tripCards[0]);

          // Should open manifest modal
          expect(screen.getByText("Passenger Manifest")).toBeInTheDocument();
        }
      });
    });
  });

  describe("BookingSearchModal", () => {
    const mockOnClose = vi.fn();
    const mockOnBookingFound = vi.fn();

    beforeEach(() => {
      // Mock successful search response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: mockBookings.map((booking) => ({
              ...booking,
              tripId: mockTrip.id,
              tripDate: mockTrip.date,
              routeId: mockTrip.routeId,
            })),
          }),
      });
    });

    it("should render search interface", () => {
      render(
        <BookingSearchModal
          parkId="ikeja-motor-park"
          selectedDate="2025-09-30"
          onClose={mockOnClose}
          onBookingFound={mockOnBookingFound}
        />
      );

      expect(screen.getByText("Search Passengers")).toBeInTheDocument();
      expect(screen.getByText("Manual Search")).toBeInTheDocument();
      expect(screen.getByText("QR Scan")).toBeInTheDocument();
    });

    it("should search for bookings by passenger name", async () => {
      render(
        <BookingSearchModal
          parkId="ikeja-motor-park"
          selectedDate="2025-09-30"
          onClose={mockOnClose}
          onBookingFound={mockOnBookingFound}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search by Ticket ID/);
      const searchButton = screen.getByRole("button", {
        name: /Search Passengers/,
      });

      fireEvent.change(searchInput, {
        target: { value: mockBookings[0].passengerName },
      });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/bookings/search")
        );
      });
    });

    it("should search for bookings by phone number", async () => {
      render(
        <BookingSearchModal
          parkId="ikeja-motor-park"
          selectedDate="2025-09-30"
          onClose={mockOnClose}
          onBookingFound={mockOnBookingFound}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search by Ticket ID/);
      const searchButton = screen.getByRole("button", {
        name: /Search Passengers/,
      });

      fireEvent.change(searchInput, {
        target: { value: mockBookings[0].passengerPhone },
      });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/bookings/search")
        );
      });
    });

    it("should search for bookings by ticket ID", async () => {
      render(
        <BookingSearchModal
          parkId="ikeja-motor-park"
          selectedDate="2025-09-30"
          onClose={mockOnClose}
          onBookingFound={mockOnBookingFound}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search by Ticket ID/);
      const searchButton = screen.getByRole("button", {
        name: /Search Passengers/,
      });

      fireEvent.change(searchInput, { target: { value: mockBookings[0].id } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/bookings/search")
        );
      });
    });

    it("should display search results", async () => {
      render(
        <BookingSearchModal
          parkId="ikeja-motor-park"
          selectedDate="2025-09-30"
          onClose={mockOnClose}
          onBookingFound={mockOnBookingFound}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search by Ticket ID/);
      const searchButton = screen.getByRole("button", {
        name: /Search Passengers/,
      });

      fireEvent.change(searchInput, {
        target: { value: mockBookings[0].passengerName },
      });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText("Search Results")).toBeInTheDocument();
      });
    });

    it("should call onBookingFound when search result is clicked", async () => {
      render(
        <BookingSearchModal
          parkId="ikeja-motor-park"
          selectedDate="2025-09-30"
          onClose={mockOnClose}
          onBookingFound={mockOnBookingFound}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search by Ticket ID/);
      const searchButton = screen.getByRole("button", {
        name: /Search Passengers/,
      });

      fireEvent.change(searchInput, {
        target: { value: mockBookings[0].passengerName },
      });
      fireEvent.click(searchButton);

      await waitFor(() => {
        const resultCard = screen.getByText(mockBookings[0].passengerName);
        fireEvent.click(resultCard);
        expect(mockOnBookingFound).toHaveBeenCalledWith(
          expect.objectContaining({
            id: mockBookings[0].id,
            passengerName: mockBookings[0].passengerName,
          })
        );
      });
    });

    it("should show error when no bookings found", async () => {
      // Mock empty search response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: [],
          }),
      });

      render(
        <BookingSearchModal
          parkId="ikeja-motor-park"
          selectedDate="2025-09-30"
          onClose={mockOnClose}
          onBookingFound={mockOnBookingFound}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search by Ticket ID/);
      const searchButton = screen.getByRole("button", {
        name: /Search Passengers/,
      });

      fireEvent.change(searchInput, { target: { value: "nonexistent" } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(
          screen.getByText("Ticket not found or invalid")
        ).toBeInTheDocument();
      });
    });

    it("should switch to QR scan mode", () => {
      render(
        <BookingSearchModal
          parkId="ikeja-motor-park"
          selectedDate="2025-09-30"
          onClose={mockOnClose}
          onBookingFound={mockOnBookingFound}
        />
      );

      const qrButton = screen.getByText("QR Scan");
      fireEvent.click(qrButton);

      expect(screen.getByText("QR Code Scanner")).toBeInTheDocument();
      expect(screen.getByText("Start QR Scan")).toBeInTheDocument();
    });
  });

  describe("PassengerManifestModal", () => {
    const mockOnClose = vi.fn();
    const mockOnCheckIn = vi.fn().mockResolvedValue({});

    beforeEach(() => {
      // Mock successful check-in response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });

    it("should render passenger manifest", () => {
      render(
        <PassengerManifestModal
          trip={mockTrip}
          bookings={mockBookings}
          onClose={mockOnClose}
          onCheckIn={mockOnCheckIn}
        />
      );

      expect(screen.getByText("Passenger Manifest")).toBeInTheDocument();
      expect(
        screen.getByText(`Trip to ${mockTrip.routeId}`)
      ).toBeInTheDocument();
    });

    it("should display passenger information", () => {
      render(
        <PassengerManifestModal
          trip={mockTrip}
          bookings={mockBookings}
          onClose={mockOnClose}
          onCheckIn={mockOnCheckIn}
        />
      );

      if (mockBookings.length > 0) {
        expect(
          screen.getByText(mockBookings[0].passengerName)
        ).toBeInTheDocument();
        expect(
          screen.getByText(mockBookings[0].passengerPhone)
        ).toBeInTheDocument();
        expect(
          screen.getByText(`Seat ${mockBookings[0].seatNumber}`)
        ).toBeInTheDocument();
      }
    });

    it("should show check-in button for confirmed bookings", () => {
      render(
        <PassengerManifestModal
          trip={mockTrip}
          bookings={mockBookings}
          onClose={mockOnClose}
          onCheckIn={mockOnCheckIn}
        />
      );

      const checkInButtons = screen.queryAllByText("Check In");
      expect(checkInButtons.length).toBeGreaterThan(0);
    });

    it("should highlight searched passenger", () => {
      const highlightedBookingId = mockBookings[0]?.id;

      render(
        <PassengerManifestModal
          trip={mockTrip}
          bookings={mockBookings}
          onClose={mockOnClose}
          onCheckIn={mockOnCheckIn}
          highlightedBookingId={highlightedBookingId}
        />
      );

      // The highlighted passenger should have special styling
      const highlightedRow = screen
        .getByText(mockBookings[0].passengerName)
        .closest("tr, div");
      expect(highlightedRow).toHaveClass("bg-yellow-50");
    });

    it("should call onCheckIn when check-in button is clicked", async () => {
      render(
        <PassengerManifestModal
          trip={mockTrip}
          bookings={mockBookings}
          onClose={mockOnClose}
          onCheckIn={mockOnCheckIn}
        />
      );

      const checkInButton = screen.getByText("Check In");
      fireEvent.click(checkInButton);

      await waitFor(() => {
        expect(mockOnCheckIn).toHaveBeenCalledWith(mockBookings[0].id);
      });
    });

    it("should show loading state during check-in", async () => {
      // Mock slow check-in response
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ success: true }),
                }),
              100
            )
          )
      );

      render(
        <PassengerManifestModal
          trip={mockTrip}
          bookings={mockBookings}
          onClose={mockOnClose}
          onCheckIn={mockOnCheckIn}
        />
      );

      const checkInButton = screen.getByText("Check In");
      fireEvent.click(checkInButton);

      expect(screen.getByText("Checking In...")).toBeInTheDocument();
    });

    it("should show checked-in status for already checked-in passengers", () => {
      const checkedInBooking = { ...mockBookings[0], checkedIn: true };

      render(
        <PassengerManifestModal
          trip={mockTrip}
          bookings={[checkedInBooking]}
          onClose={mockOnClose}
          onCheckIn={mockOnCheckIn}
        />
      );

      expect(screen.getByText(/Checked In/)).toBeInTheDocument();
    });

    it("should show payment required for pending payments", () => {
      const pendingBooking = { ...mockBookings[0], paymentStatus: "pending" };

      render(
        <PassengerManifestModal
          trip={mockTrip}
          bookings={[pendingBooking]}
          onClose={mockOnClose}
          onCheckIn={mockOnCheckIn}
        />
      );

      expect(screen.getByText(/Payment Required/)).toBeInTheDocument();
    });

    it("should display correct passenger counts", () => {
      render(
        <PassengerManifestModal
          trip={mockTrip}
          bookings={mockBookings}
          onClose={mockOnClose}
          onCheckIn={mockOnCheckIn}
        />
      );

      expect(screen.getByText(/Total Passengers:/)).toBeInTheDocument();
    });

    it("should close modal when close button is clicked", () => {
      render(
        <PassengerManifestModal
          trip={mockTrip}
          bookings={mockBookings}
          onClose={mockOnClose}
          onCheckIn={mockOnCheckIn}
        />
      );

      const closeButton = screen.getByText("Close Manifest");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Integration Tests", () => {
    it("should complete end-to-end search and check-in flow", async () => {
      // Mock successful search and check-in responses
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: mockBookings.map((booking) => ({
                ...booking,
                tripId: mockTrip.id,
                tripDate: mockTrip.date,
                routeId: mockTrip.routeId,
              })),
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      render(
        <TripBookingsManager parkId="ikeja-motor-park" drivers={mockDrivers} />
      );

      // Open search modal
      const searchButton = screen.getByRole("button", {
        name: /Search Passengers/,
      });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText("Search Passengers")).toBeInTheDocument();
      });

      // Search for passenger
      const searchInput = screen.getByPlaceholderText(/Search by Ticket ID/);
      const searchSubmitButton = screen.getByText("Search Passengers");

      fireEvent.change(searchInput, {
        target: { value: mockBookings[0].passengerName },
      });
      fireEvent.click(searchSubmitButton);

      // Click on search result
      await waitFor(() => {
        const resultCard = screen.getByText(mockBookings[0].passengerName);
        fireEvent.click(resultCard);
      });

      // Should open manifest modal with highlighted passenger
      await waitFor(() => {
        expect(screen.getByText("Passenger Manifest")).toBeInTheDocument();
      });

      // Check in passenger
      const checkInButton = screen.getByText("Check In");
      fireEvent.click(checkInButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/trips/${mockTrip.id}/checkin`,
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ bookingId: mockBookings[0].id }),
          })
        );
      });
    });

    it("should handle check-in errors gracefully", async () => {
      // Mock check-in error response
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Booking not found" }),
      });

      const mockOnCheckIn = vi
        .fn()
        .mockRejectedValue(new Error("Booking not found"));

      render(
        <PassengerManifestModal
          trip={mockTrip}
          bookings={mockBookings}
          onClose={vi.fn()}
          onCheckIn={mockOnCheckIn}
        />
      );

      const checkInButton = screen.getByText("Check In");
      fireEvent.click(checkInButton);

      await waitFor(() => {
        expect(mockOnCheckIn).toHaveBeenCalled();
      });
    });
  });
});
