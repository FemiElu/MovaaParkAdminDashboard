"use client";

import React, { useState, useMemo, useEffect } from "react";
import { tripsStore, Vehicle } from "@/lib/trips-store";
import { DateTimeSelector } from "../trips/date-time-selector";
import { EnhancedTripCard } from "../trips/enhanced-trip-card";
import { RouteTabs } from "../trips/route-tabs";
import { listRoutes } from "@/lib/routes-store";
// import { Trip } from "@/types"; // Unused import

interface LiveTripsManagerProps {
  parkId: string;
  vehicles: Vehicle[];
  drivers: Array<{
    id: string;
    name: string;
    phone: string;
    rating: number;
    parkId: string;
    routeIds?: string[];
  }>;
}

export function LiveTripsManager({
  parkId,
  vehicles,
  drivers,
}: LiveTripsManagerProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

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

  // Get routes for the current park
  const routes = useMemo(() => listRoutes(parkId), [parkId]);

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

  // Calculate stats for the selected date/time/route
  // const stats = useMemo(() => {
  //   const totalBookings = filteredTrips.reduce((sum, trip) => {
  //     const bookings = tripsStore.getBookings(trip.id);
  //     return sum + bookings.length;
  //   }, 0);

  //   const totalRevenue = filteredTrips.reduce((sum, trip) => {
  //     const bookings = tripsStore.getBookings(trip.id);
  //     return (
  //       sum +
  //       bookings.reduce(
  //         (bookingSum, booking) => bookingSum + booking.amountPaid,
  //         0
  //       )
  //     );
  //   }, 0);

  //   return {
  //     totalTrips: filteredTrips.length,
  //     totalBookings,
  //     totalRevenue,
  //   };
  // }, [filteredTrips]);

  return (
    <div className="space-y-6">
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

      {/* Live Trips List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Live Trip Operations
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {!selectedDate ? (
                  "Loading trips..."
                ) : (
                  <>
                    {filteredTrips.length} active trip
                    {filteredTrips.length !== 1 ? "s" : ""} for {selectedDate}{" "}
                    at {departureTime}
                    {selectedRouteId && (
                      <span>
                        {" "}
                        to{" "}
                        <span className="font-medium text-blue-600">
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
                No active trips
              </h3>
              <p className="text-gray-600 mb-4">
                {!selectedDate
                  ? "Loading trips..."
                  : `There are no active trips for ${selectedDate} at 6:00 AM.`}
              </p>
              <p className="text-sm text-gray-500">
                Create trips in the Trips section to see them here with
                passenger bookings.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredTrips.map((trip) => {
                const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
                const driver = drivers.find((d) => d.id === trip.driverId);
                const bookings = tripsStore.getBookings(trip.id);
                const parcels = tripsStore.getParcels(trip.id);

                return (
                  <EnhancedTripCard
                    key={trip.id}
                    trip={trip}
                    vehicle={vehicle}
                    driver={driver}
                    drivers={drivers}
                    bookingsCount={bookings.length}
                    parcelsCount={parcels.length}
                    onEdit={undefined} // No editing in bookings section
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
