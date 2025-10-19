"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { bookingApiService } from "@/lib/booking-api-service";
import { routeApiService } from "@/lib/route-api-service";
import { tripApiService, Trip } from "@/lib/trip-api-service";
import { RouteTabs } from "../trips/route-tabs";
import { DateTimeSelector } from "../trips/date-time-selector";
import { TripBookingCard } from "./trip-booking-card";
import { PassengerManifestModal } from "./passenger-manifest-modal";
import { BookingSearchModal } from "./booking-search-modal";
import { RouteConfig, Booking } from "@/types";

interface TripBookingsManagerV2Props {
  parkId: string;
  drivers: Array<{
    id: string;
    name: string;
    phone: string;
    rating: number;
    parkId: string;
    routeIds?: string[];
  }>;
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

export function TripBookingsManagerV2({
  parkId,
  drivers,
}: TripBookingsManagerV2Props) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripWithBookings | null>(
    null
  );
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [localCheckedIn, setLocalCheckedIn] = useState<Set<string>>(new Set());
  const [highlightedBookingId, setHighlightedBookingId] = useState<
    string | null
  >(null);
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const [trips, setTrips] = useState<TripWithBookings[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError("Failed to fetch routes");
    }
  }, [parkId]);

  // Fetch trips with bookings for the selected date and route
  const fetchTripsWithBookings = useCallback(async () => {
    if (!selectedDate || !isClient) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch real trips from the backend
      const tripsResponse = await tripApiService.getAllTrips();

      if (!tripsResponse.success) {
        console.error("Failed to fetch trips:", tripsResponse);
        setError("Failed to fetch trips from backend");
        return;
      }

      const backendTrips = tripsResponse.data;
      const tripsWithBookings: TripWithBookings[] = [];

      // Filter trips by date and route
      const filteredTrips = backendTrips.filter((trip: Trip) => {
        // Filter by date
        if (trip.departure_date !== selectedDate) return false;

        // Filter by departure time (if specified)
        if (trip.departure_time !== departureTime) return false;

        // Filter by route if selected
        if (selectedRouteId && trip.to_route.id !== selectedRouteId)
          return false;

        return true;
      });

      // For each filtered trip, fetch its bookings
      for (const trip of filteredTrips) {
        // Fetch bookings for this trip
        const bookingsResponse = await bookingApiService.getTripBookings(
          trip.id
        );

        let bookings: Booking[] = [];

        if (bookingsResponse.success) {
          bookings = bookingsResponse.data.map((booking) =>
            bookingApiService.convertBackendBookingToFrontend(booking)
          );
        } else {
          // Other errors (401, 500, etc.)
          console.error(
            `Error fetching bookings for trip ${trip.id}:`,
            bookingsResponse.error
          );
        }

        // Convert backend trip to frontend format
        const tripWithBookings: TripWithBookings = {
          id: trip.id,
          parkId: parkId, // Use the parkId from props
          routeId: trip.to_route.id,
          destination: trip.to_route.to_city,
          date: trip.departure_date,
          unitTime: trip.departure_time,
          seatCount: trip.total_seats,
          confirmedBookingsCount: bookings.length,
          maxParcelsPerVehicle: 10, // Default value since not provided by backend
          driverId: undefined,
          driverPhone: undefined,
          price: trip.price,
          status: trip.is_cancelled
            ? "cancelled"
            : trip.is_completed
            ? "completed"
            : "published",
          payoutStatus: "NotScheduled",
          isRecurring: false,
          recurrencePattern: undefined,
          createdAt: trip.created_at,
          updatedAt: trip.updated_at || trip.created_at,
          bookings: bookings,
          driver:
            drivers.find((d) => d.routeIds?.includes(trip.to_route.id)) ||
            undefined,
        };

        tripsWithBookings.push(tripWithBookings);
      }

      setTrips(tripsWithBookings);
    } catch (error) {
      console.error("Failed to fetch trips with bookings:", error);
      setError("Failed to fetch trips with bookings");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedRouteId, departureTime, drivers, isClient, parkId]);

  // Fetch routes on mount
  useEffect(() => {
    if (isClient) {
      fetchRoutes();
    }
  }, [isClient, fetchRoutes]);

  // Fetch trips when date, route, or routes change
  useEffect(() => {
    if (isClient && selectedDate && routes.length > 0) {
      fetchTripsWithBookings();
    }
  }, [isClient, selectedDate, selectedRouteId, routes, fetchTripsWithBookings]);

  // Get trips filtered by date and route
  const filteredTrips = useMemo(() => {
    if (!selectedDate || !isClient) {
      return [];
    }

    let filtered = trips.filter((trip) => trip.unitTime === departureTime);

    // Filter by route if selected
    if (selectedRouteId) {
      filtered = filtered.filter((trip) => trip.routeId === selectedRouteId);
    }

    return filtered;
  }, [trips, selectedDate, departureTime, selectedRouteId, isClient]);

  const handleTripClick = (trip: TripWithBookings, bookingId?: string) => {
    setSelectedTrip(trip);
    setHighlightedBookingId(bookingId || null);
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
        setLocalCheckedIn((prev) => new Set(prev).add(bookingId));

        // Refresh the trip data
        await fetchTripsWithBookings();

        // Update the selected trip
        const updatedTrip = trips.find((t) => t.id === selectedTrip.id);
        if (updatedTrip) {
          setSelectedTrip(updatedTrip);
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
                {loading ? (
                  "Loading trips..."
                ) : error ? (
                  <span className="text-red-600">{error}</span>
                ) : (
                  <>
                    {filteredTrips.length} trip
                    {filteredTrips.length !== 1 ? "s" : ""} for {selectedDate}{" "}
                    at {departureTime}
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
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading trips...</p>
            </div>
          ) : filteredTrips.length === 0 ? (
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
              {filteredTrips.map((trip) => (
                <TripBookingCard
                  key={trip.id}
                  trip={trip}
                  bookings={trip.bookings}
                  parcels={[]}
                  onClick={() => handleTripClick(trip)}
                  localCheckedIn={localCheckedIn}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Passenger Manifest Modal */}
      {selectedTrip && (
        <PassengerManifestModal
          trip={selectedTrip}
          bookings={selectedTrip.bookings}
          onClose={handleCloseManifest}
          onCheckIn={handleCheckIn}
          highlightedBookingId={highlightedBookingId}
          onLocalCheckIn={(bookingId) => {
            setLocalCheckedIn((prev) => new Set([...prev, bookingId]));
          }}
        />
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
