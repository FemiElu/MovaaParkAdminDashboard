"use client";

import React, { useState, useMemo, useEffect } from "react";
import { tripsStore, Vehicle } from "@/lib/trips-store";
import { DateTimeSelector } from "./date-time-selector";
import { EnhancedTripCard } from "./enhanced-trip-card";
import { RouteTabs } from "./route-tabs";
import { listRoutes } from "@/lib/routes-store";

interface TripsPageClientProps {
  parkId: string;
  vehicles: Vehicle[];
  drivers: Array<{
    id: string;
    name: string;
    phone: string;
    rating: number;
    parkId: string;
  }>;
}

export function TripsPageClient({
  parkId,
  vehicles,
  drivers,
}: TripsPageClientProps) {
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

  // Calculate simplified stats for the selected date/time/route
  const stats = useMemo(() => {
    const totalBookings = filteredTrips.reduce((sum, trip) => {
      const bookings = tripsStore.getBookings(trip.id);
      return sum + bookings.length;
    }, 0);

    return {
      totalTrips: filteredTrips.length,
      totalBookings,
    };
  }, [filteredTrips]);

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <DateTimeSelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Quick Stats - Simplified */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Scheduled Trips
              </p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.totalTrips}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Passengers
              </p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.totalBookings}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Route Tabs */}
      <RouteTabs
        routes={routes}
        selectedRouteId={selectedRouteId}
        onRouteSelect={setSelectedRouteId}
      />

      {/* Trips List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Trip Schedule
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {!selectedDate ? (
                  "Loading trips..."
                ) : (
                  <>
                    {filteredTrips.length} trip
                    {filteredTrips.length !== 1 ? "s" : ""} scheduled for{" "}
                    {selectedDate} at {departureTime}
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
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
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Schedule New Trip
              </button>
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
