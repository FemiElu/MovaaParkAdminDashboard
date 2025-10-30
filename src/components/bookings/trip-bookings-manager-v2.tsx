"use client";

import React, { useState, useEffect, useCallback } from "react";
import { bookingApiService, BackendBooking } from "@/lib/booking-api-service";
import { routeApiService } from "@/lib/route-api-service";
import { RouteTabs } from "../trips/route-tabs";
import { DateTimeSelector } from "../trips/date-time-selector";
import { TripBookingCard } from "./trip-booking-card";
import { PassengerManifestModal } from "./passenger-manifest-modal";
import { BookingSearchModal } from "./booking-search-modal";
import { RouteConfig, Booking } from "@/types";
import { Trip } from "@/lib/trip-api-service";
import { tripApiService } from "@/lib/trip-api-service";

// --- TEMP inline BackendTrip interface ---
interface BackendTrip {
  id: string;
  to_route?: {
    id: string;
    to_city?: string;
  };
  departure_date: string;
  departure_time: string;
  total_seats: number;
  is_cancelled?: boolean;
  is_completed?: boolean;
  is_active?: boolean;
  price: number;
  created_at?: string;
  updated_at?: string;
}
// ----------------------------------------

interface TripBookingsManagerV2Props {
  parkId: string;
}

interface TripWithBookings {
  id: string;
  parkId: string;
  routeId: string;
  destination: string;
  date: string;
  unitTime: string;
  seatCount: number;
  confirmedBookingsCount: number;
  maxParcelsPerVehicle: number;
  driverId?: string;
  driverPhone?: string;
  price: number;
  status: "draft" | "published" | "live" | "completed" | "cancelled";
  payoutStatus: "NotScheduled" | "Scheduled" | "Paid";
  isRecurring: boolean;
  recurrencePattern?: {
    type: "daily" | "weekdays" | "custom";
    interval?: number;
    daysOfWeek?: number[];
    endDate?: string;
    exceptions?: string[];
  };
  createdAt: string;
  updatedAt: string;
  bookings: Booking[];
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
  };
}

export function TripBookingsManagerV2({ parkId }: TripBookingsManagerV2Props) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripWithBookings | null>(
    null
  );
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [highlightedBookingId, setHighlightedBookingId] = useState<
    string | null
  >(null);
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [trips, setTrips] = useState<BackendTrip[]>([]);
  const [tripBookings, setTripBookings] = useState<Record<string, Booking[]>>(
    {}
  );
  const [modalLoading, setModalLoading] = useState(false);

  // Static departure time
  const departureTime = "06:00";

  // Set today's date after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    if (!selectedDate) {
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
    }
  }, [selectedDate]);

  // Fetch routes from API
  const fetchRoutes = useCallback(async () => {
    try {
      const response = await routeApiService.getAllRoutes();
      if (response.success) {
        // Convert API Route format to RouteConfig format
        const convertedRoutes = response.data.map((route) => ({
          id: route.id,
          parkId: parkId || "default-park",
          destination: route.to_city,
          destinationPark: route.to_state,
          from_state: route.from_state,
          isActive: true,
          createdAt: route.created_at || new Date().toISOString(),
          updatedAt: route.updated_at || new Date().toISOString(),
        }));
        setRoutes(convertedRoutes);
      }
    } catch (error) {
      console.error("Failed to fetch routes:", error);
      // setError("Failed to fetch routes"); // Removed unused error state
    }
  }, [parkId]);

  // Fetch trips for current date and route
  const fetchTrips = useCallback(async () => {
    setLoadingTrips(true);
    // setError(null); // Removed unused error state
    try {
      const tripResp = await tripApiService.getAllTrips();
      if (!tripResp.success) {
        setTrips([]);
        // setError('Failed to fetch trips'); // Removed unused error state
        return;
      }
      // When fetching, use backend trip type for list (no frontend conversion).
      let filtered: any[] = tripResp.data;
      // date
      if (selectedDate) {
        filtered = filtered.filter((t) => t.departure_date === selectedDate);
      }
      // route
      if (selectedRouteId) {
        filtered = filtered.filter((t) => t.to_route?.id === selectedRouteId);
      }
      // departure time (static)
      filtered = filtered.filter((t) => t.departure_time === departureTime);
      setTrips(filtered);
    } catch (error) {
      // setError('Failed to fetch trips'); // Removed unused error state
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, [selectedDate, selectedRouteId, departureTime, parkId]);

  // Fetch routes on mount
  useEffect(() => {
    if (isClient) {
      fetchRoutes();
    }
  }, [isClient, fetchRoutes]);

  // Fetch trips on load/date/route change
  useEffect(() => {
    if (isClient) fetchTrips();
  }, [isClient, fetchTrips]);

  // When a trip is clicked, fetch bookings for that trip
  const handleTripClick = async (trip: BackendTrip, bookingId?: string) => {
    setModalLoading(true);
    setSelectedTrip(null); // clear any previous selection to force modal rerender/loading
    setHighlightedBookingId(bookingId || null);
    try {
      let bookingsForTrip = tripBookings[trip.id];
      if (!bookingsForTrip) {
        const bookingsResp = await bookingApiService.getTripBookings(trip.id);
        if (bookingsResp.success && bookingsResp.data) {
          bookingsForTrip = (bookingsResp.data as BackendBooking[]).map(
            (bk: BackendBooking) =>
              bookingApiService.convertBackendBookingToFrontend(bk)
          );
          setTripBookings((prev) => ({ ...prev, [trip.id]: bookingsForTrip }));
        } else {
          setTripBookings((prev) => ({ ...prev, [trip.id]: [] }));
        }
      }
      const tripWithBookings: TripWithBookings = {
        id: trip.id,
        parkId: parkId || "",
        routeId: trip.to_route?.id || "",
        destination: trip.to_route?.to_city || "",
        date: trip.departure_date,
        unitTime: trip.departure_time,
        seatCount: trip.total_seats,
        confirmedBookingsCount: bookingsForTrip?.length || 0,
        maxParcelsPerVehicle: 10,
        driverId: undefined,
        driverPhone: undefined,
        price: trip.price,
        status: (trip.is_cancelled
          ? "cancelled"
          : trip.is_completed
          ? "completed"
          : trip.is_active
          ? "published"
          : "draft") as TripWithBookings["status"],
        payoutStatus: "NotScheduled" as TripWithBookings["payoutStatus"],
        isRecurring: false,
        recurrencePattern: undefined,
        createdAt: trip.created_at || "",
        updatedAt: trip.updated_at || "",
        bookings: bookingsForTrip || [],
        driver: undefined,
      };
      setSelectedTrip(tripWithBookings);
    } catch (error) {
      setTripBookings((prev) => ({ ...prev, [trip.id]: [] }));
      setSelectedTrip({
        id: trip.id,
        parkId: parkId || "",
        routeId: trip.to_route?.id || "",
        destination: trip.to_route?.to_city || "",
        date: trip.departure_date,
        unitTime: trip.departure_time,
        seatCount: trip.total_seats,
        confirmedBookingsCount: 0,
        maxParcelsPerVehicle: 10,
        driverId: undefined,
        driverPhone: undefined,
        price: trip.price,
        status: (trip.is_cancelled
          ? "cancelled"
          : trip.is_completed
          ? "completed"
          : trip.is_active
          ? "published"
          : "draft") as TripWithBookings["status"],
        payoutStatus: "NotScheduled" as TripWithBookings["payoutStatus"],
        isRecurring: false,
        recurrencePattern: undefined,
        createdAt: trip.created_at || "",
        updatedAt: trip.updated_at || "",
        bookings: [],
        driver: undefined,
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseManifest = () => {
    setSelectedTrip(null);
    setHighlightedBookingId(null);
  };

  const handleCheckIn = async (bookingId: string) => {
    if (!selectedTrip) return;

    try {
      const response = await bookingApiService.checkInBooking(bookingId);

      if (response.success) {
        // Add to local checked-in set for immediate UI update
        // setLocalCheckedIn((prev) => new Set(prev).add(bookingId)); // Removed localCheckedIn

        // Refresh the trip data
        await fetchTrips(); // Re-fetch trips to update the list

        // Update the selected trip
        const updatedTrip = trips.find((t) => t.id === selectedTrip.id);
        if (updatedTrip) {
          setSelectedTrip({
            ...selectedTrip,
            bookings: tripBookings[updatedTrip.id] || [], // Update bookings in selectedTrip
          });
        }

        // Show success message
        console.log("Passenger checked in successfully");
      } else {
        alert(`Check-in failed: ${response.error}`);
      }
    } catch (error) {
      console.error("Error checking in passenger:", error);
      alert("Failed to check in passenger");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Passenger Check-In
          </h2>
          <p className="text-gray-600 mt-1">
            Manage passenger check-ins for today
          </p>
        </div>
        <button
          onClick={() => setShowSearchModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-colors duration-200 shadow-sm"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Search Passengers
        </button>
      </div>

      {/* Date Selector */}
      <DateTimeSelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Route Tabs */}
      <RouteTabs
        routes={routes}
        selectedRouteId={selectedRouteId}
        onRouteSelect={setSelectedRouteId}
      />

      {/* Trip Cards */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Trip Bookings
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {loadingTrips ? (
                  "Loading trips..."
                ) : (
                  <>
                    {trips.length} trip
                    {trips.length !== 1 ? "s" : ""} for {selectedDate} at{" "}
                    {departureTime}
                    {selectedRouteId && (
                      <span>
                        {" "}
                        to{" "}
                        <span className="font-medium text-green-600">
                          {
                            routes.find((r) => r.id === selectedRouteId)
                              ?.destination
                          }
                        </span>
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loadingTrips ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading trips...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No trips scheduled
              </h3>
              <p className="text-gray-600 mb-4">
                {!selectedDate
                  ? "Loading trips..."
                  : `There are no trips scheduled for ${selectedDate} at 6:00 AM.`}
              </p>
              <p className="text-sm text-gray-500">
                Create a trip to start managing bookings.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip: BackendTrip) => (
                <TripBookingCard
                  key={trip.id}
                  trip={trip}
                  bookings={[]}
                  parcels={[]}
                  onClick={() => handleTripClick(trip)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Passenger Manifest Modal (on-demand bookings fetch) */}
      {modalLoading ? (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl">
            Loading bookings...
          </div>
        </div>
      ) : (
        selectedTrip && (
          <PassengerManifestModal
            trip={selectedTrip}
            bookings={selectedTrip.bookings}
            onClose={handleCloseManifest}
            onCheckIn={handleCheckIn}
            highlightedBookingId={highlightedBookingId}
            onLocalCheckIn={() => {}}
          />
        )
      )}

      {/* Booking Search Modal */}
      {showSearchModal && (
        <BookingSearchModal
          parkId={parkId}
          selectedDate={selectedDate}
          onClose={() => setShowSearchModal(false)}
          onBookingFound={(booking) => {
            // Find the trip for this booking
            const trip = trips.find((t) =>
              t.bookings.some((b) => b.id === booking.id)
            );
            if (trip) {
              handleTripClick(trip, booking.id);
            }
            setShowSearchModal(false);
          }}
        />
      )}
    </div>
  );
}
