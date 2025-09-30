"use client";

import React, { useState, useMemo, useEffect } from "react";
import { tripsStore } from "@/lib/trips-store";
import { RouteTabs } from "../trips/route-tabs";
import { DateTimeSelector } from "../trips/date-time-selector";
import { TripBookingCard } from "./trip-booking-card";
import { PassengerManifestModal } from "./passenger-manifest-modal";
import { BookingSearchModal } from "./booking-search-modal";
import { Trip, RouteConfig } from "@/types";

interface TripBookingsManagerProps {
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

export function TripBookingsManager({
  parkId,
  drivers,
}: TripBookingsManagerProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [localCheckedIn, setLocalCheckedIn] = useState<Set<string>>(new Set());
  const [highlightedBookingId, setHighlightedBookingId] = useState<
    string | null
  >(null);
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  // Fetch routes from API to get the latest data
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch(`/api/routes?parkId=${parkId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setRoutes(result.data || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch routes:", error);
      }
    };

    if (isClient) {
      fetchRoutes();
    }
  }, [parkId, isClient]);

  // Get trips filtered by date and route (time is static 06:00)
  const filteredTrips = useMemo(() => {
    // Don't filter trips until we have a valid date to avoid hydration mismatch
    if (!selectedDate || !isClient) {
      return [];
    }

    const allTrips = tripsStore.getTrips(parkId, selectedDate);
    let filtered = allTrips.filter((trip) => trip.unitTime === departureTime);

    // Filter by route if selected
    if (selectedRouteId) {
      filtered = filtered.filter((trip) => trip.routeId === selectedRouteId);
    }

    return filtered;
  }, [parkId, selectedDate, departureTime, selectedRouteId, isClient]);

  const handleTripClick = (trip: Trip, bookingId?: string) => {
    // Always get fresh trip data with latest booking statuses
    const freshTrip = tripsStore.getTrip(trip.id);
    setSelectedTrip(freshTrip || trip);

    // Always set highlighted booking ID (null if not provided)
    setHighlightedBookingId(bookingId || null);

    // Force refresh of trips data to get updated booking statuses
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCloseManifest = () => {
    setSelectedTrip(null);
    setHighlightedBookingId(null);
  };

  const handleCheckIn = async (bookingId: string) => {
    if (!selectedTrip) return;

    try {
      const response = await fetch(`/api/trips/${selectedTrip.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (response.ok) {
        // Add to local checked-in set for immediate UI update
        setLocalCheckedIn((prev) => new Set(prev).add(bookingId));

        // Force refresh of trips data to get updated booking statuses
        setRefreshTrigger((prev) => prev + 1);

        // Refresh the currently selected trip with latest data
        const updatedTrip = tripsStore.getTrip(selectedTrip.id);
        if (updatedTrip) {
          setSelectedTrip(updatedTrip);
        }
        // Show success message
        // TODO: Add toast notification
      } else {
        const error = await response.json();
        alert(`Check-in failed: ${error.error}`);
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
                {!selectedDate ? (
                  "Loading trips..."
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
                          {Array.isArray(routes)
                            ? routes.find((r) => r.id === selectedRouteId)
                                ?.destination
                            : undefined}
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
          {filteredTrips.length === 0 ? (
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
                Create trips in the Trips section to see them here with
                passenger bookings.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredTrips.map((trip) => {
                const driver = Array.isArray(drivers)
                  ? drivers.find((d) => d.id === trip.driverId)
                  : undefined;
                const bookings = tripsStore.getBookings(trip.id);
                const parcels = tripsStore.getParcels(trip.id);
                const route = Array.isArray(routes)
                  ? routes.find((r) => r.id === trip.routeId)
                  : undefined;

                return (
                  <TripBookingCard
                    key={trip.id}
                    trip={trip}
                    driver={driver}
                    route={route}
                    bookings={bookings}
                    parcels={parcels}
                    localCheckedIn={localCheckedIn}
                    onClick={() => handleTripClick(trip)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Passenger Manifest Modal */}
      {selectedTrip && (
        <PassengerManifestModal
          trip={selectedTrip}
          bookings={tripsStore.getBookings(selectedTrip.id)}
          onClose={handleCloseManifest}
          onCheckIn={handleCheckIn}
          onLocalCheckIn={(bookingId) => {
            setLocalCheckedIn((prev) => new Set(prev).add(bookingId));
          }}
          highlightedBookingId={highlightedBookingId}
          refreshTrigger={refreshTrigger}
        />
      )}

      {/* Booking Search Modal */}
      {showSearchModal && (
        <BookingSearchModal
          parkId={parkId}
          selectedDate={selectedDate}
          onClose={() => setShowSearchModal(false)}
          onBookingFound={(booking) => {
            // Find the trip for this booking and open manifest with highlighted passenger
            const trip = tripsStore.getTrip(booking.tripId);
            if (trip) {
              handleTripClick(trip, booking.id);
              setShowSearchModal(false);
            }
          }}
        />
      )}
    </div>
  );
}
