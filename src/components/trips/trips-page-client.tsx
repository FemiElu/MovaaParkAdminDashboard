"use client";

import React, { useState, useMemo, useEffect } from "react";
import { RouteTabs } from "./route-tabs";
import { CreateEditTripModal } from "./create-edit-trip-modal";
import { TripFormData, Trip, RouteConfig } from "@/types";
// (popover removed)

interface TripsPageClientProps {
  parkId: string;
  drivers?: Array<{
    id: string;
    name: string;
    phone: string;
    rating: number;
    parkId: string;
    qualifiedRoute: string;
  }>;
}

export function TripsPageClient({
  parkId,
  drivers: initialDrivers = [],
}: TripsPageClientProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [apiTrips, setApiTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState(initialDrivers || []);
  const [routes, setRoutes] = useState<RouteConfig[]>([]);

  // Static departure time
  const departureTime = "06:00";

  // Set default date (tomorrow) after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    if (!selectedDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      setSelectedDate(tomorrowStr);
    }
  }, [selectedDate]);

  // Fetch drivers from API to get the latest data
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch(`/api/drivers?parkId=${parkId}`);
        if (response.ok) {
          const result = await response.json();
          // The API returns { success: true, data: { data: [...], total, page, limit, hasNext, hasPrev } }
          const driversArray = result.data?.data || result.data || [];
          setDrivers(Array.isArray(driversArray) ? driversArray : []);
        }
      } catch (error) {
        console.error("Failed to fetch drivers:", error);
      }
    };

    if (isClient) {
      fetchDrivers();
    }
  }, [parkId, isClient]);

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

  // Fetch trips from API so server-created data is reflected client-side
  useEffect(() => {
    if (!isClient || !selectedDate) return;
    const controller = new AbortController();
    const fetchTrips = async () => {
      try {
        const params = new URLSearchParams({ parkId, date: selectedDate });
        const res = await fetch(`/api/trips?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = await res.json();
        console.log("Trips fetch response:", json);
        console.log(
          "Fetching trips for date:",
          selectedDate,
          "parkId:",
          parkId
        );

        if (json?.success && Array.isArray(json.data)) {
          console.log("Setting trips:", json.data);
          setApiTrips(json.data as Trip[]);
        } else {
          console.log("No trips found or invalid response");
          setApiTrips([]);
        }
      } catch {
        // ignore for now
        setApiTrips([]);
      }
    };
    fetchTrips();
    return () => controller.abort();
  }, [isClient, selectedDate, parkId]);

  // Get trips filtered by date and route (time is static 06:00)
  const filteredTrips = useMemo(() => {
    // Don't filter trips until we have a valid date to avoid hydration mismatch
    if (!selectedDate || !isClient) {
      return [];
    }

    const allTrips = apiTrips; // authoritative source from server
    let filtered = allTrips.filter((trip) => trip.unitTime === departureTime);

    // Filter by route if selected
    if (selectedRouteId) {
      filtered = filtered.filter((trip) => trip.routeId === selectedRouteId);
    }

    return filtered;
  }, [apiTrips, selectedDate, departureTime, selectedRouteId, isClient]);

  // Calculate simplified stats for the selected date/time/route
  const stats = useMemo(() => {
    const totalBookings = filteredTrips.reduce((sum, trip) => {
      return sum + trip.confirmedBookingsCount;
    }, 0);

    return {
      totalTrips: filteredTrips.length,
      totalBookings,
    };
  }, [filteredTrips]);

  // Handle trip creation/editing
  const handleSaveTrip = async (
    tripData: TripFormData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parkId,
          ...tripData,
        }),
      });

      // If server returns an empty body (some environments), still treat 2xx as success
      if (!response.ok) {
        let errorMessage = "Failed to save trip";
        try {
          const maybeJson = await response.json();
          errorMessage = maybeJson?.error || errorMessage;
        } catch {
          try {
            errorMessage = (await response.text()) || errorMessage;
          } catch {}
        }
        return { success: false, error: errorMessage };
      }

      // Try to parse JSON if available, and merge created trips into view
      try {
        const result = await response.json();
        console.log("Trip creation response:", result);

        if (result && result.success === false) {
          return { success: false, error: result.error };
        }
        const created = result?.data?.trips as Trip[] | undefined;
        console.log("Created trips:", created);
        console.log("Selected date:", selectedDate);

        if (Array.isArray(created) && created.length > 0) {
          // If the created trips are for a different date/route than the current filters,
          // switch filters so the user immediately sees what they just created.
          const first = created[0];
          if (first?.date && first?.routeId) {
            if (first.date !== selectedDate) {
              console.log("Switching UI to created trip date:", first.date);
              setSelectedDate(first.date);
            }
            if (first.routeId !== selectedRouteId) {
              console.log("Switching UI to created trip route:", first.routeId);
              setSelectedRouteId(first.routeId);
            }
          }

          // Optimistically merge created trips that match the target date shown after potential switch
          const targetDate = first?.date || selectedDate;
          const toShow = created.filter((t) => t.date === targetDate);
          console.log("Trips to merge for target date", targetDate, toShow);

          setApiTrips((prev) => {
            // Avoid duplicates by id
            const existingIds = new Set(prev.map((t) => t.id));
            const additions = toShow.filter((t) => !existingIds.has(t.id));
            const newTrips = additions.length ? [...prev, ...additions] : prev;
            console.log("Updated trips list:", newTrips);
            return newTrips;
          });
        }
      } catch (error) {
        console.log("Error parsing trip creation response:", error);
        // No JSON body – proceed
      }

      // No hard reload; data is merged above and useEffect will refetch

      return { success: true };
    } catch {
      return { success: false, error: "Failed to save trip" };
    }
  };

  const handleCreateTrip = () => {
    setEditingTrip(null);
    setShowCreateModal(true);
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingTrip(null);
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats - Mobile Responsive */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-full">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 truncate">
                Scheduled Trips
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">
                {stats.totalTrips}
              </p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6 text-green-600"
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
        <div className="bg-white p-3 sm:p-6 rounded-xl border border-gray-200 shadow-sm h-full">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 truncate">
                Total Passengers
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">
                {stats.totalBookings}
              </p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600"
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Trip Schedule
              </h2>
              <p className="text-sm text-gray-600 mt-1 break-words">
                {!selectedDate ? (
                  "Loading trips..."
                ) : (
                  <>
                    {filteredTrips.length} trip
                    {filteredTrips.length !== 1 ? "s" : ""} scheduled for{" "}
                    <span className="font-medium">{selectedDate}</span> at{" "}
                    <span className="font-medium">{departureTime}</span>
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
            <div className="flex-shrink-0 flex items-center gap-3">
              {/* Native Date Picker (restored) */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="trip-date"
                  className="text-sm text-gray-700 hidden sm:block"
                >
                  Date
                </label>
                <input
                  id="trip-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 sm:h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <button
                onClick={handleCreateTrip}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 shadow-sm w-full sm:w-auto"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Trip
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {filteredTrips.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="mx-auto h-20 w-20 sm:h-24 sm:w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
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
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                {!selectedDate
                  ? "Loading trips..."
                  : `There are no trips scheduled for ${selectedDate} at 6:00 AM.`}
              </p>
              <button
                onClick={handleCreateTrip}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 shadow-sm"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Schedule New Trip
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTrips.map((trip) => {
                const driver = Array.isArray(drivers)
                  ? drivers.find((d) => d.id === trip.driverId)
                  : undefined;
                const route = Array.isArray(routes)
                  ? routes.find((r) => r.id === trip.routeId)
                  : undefined;

                return (
                  <div
                    key={trip.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Trip Header with Status Dot */}
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-bold text-lg text-gray-900 truncate">
                            {route?.destination || "Unknown Route"}
                          </h3>
                          <div
                            className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              trip.status === "published"
                                ? "bg-green-500"
                                : trip.status === "live"
                                ? "bg-blue-500"
                                : "bg-gray-400"
                            }`}
                            title={trip.status}
                          />
                        </div>

                        {/* Trip Details - Vertical Layout */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-400 flex-shrink-0"
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
                            <span className="text-gray-600">
                              {new Date(trip.date).toLocaleDateString("en-US", {
                                month: "numeric",
                                day: "numeric",
                                year: "numeric",
                              })}{" "}
                              at {trip.unitTime}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-400 flex-shrink-0"
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
                            <span className="text-gray-600">
                              Seats:{" "}
                              <span className="font-medium text-gray-900">
                                {trip.seatCount}
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-400 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                              />
                            </svg>
                            <span className="text-gray-600">
                              Price:{" "}
                              <span className="font-bold text-green-600">
                                ₦{trip.price.toLocaleString()}
                              </span>
                            </span>
                          </div>

                          {driver && (
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-gray-400 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              <span className="text-gray-600">
                                Driver:{" "}
                                <span className="font-medium text-gray-900">
                                  {driver.name}
                                </span>
                                {trip.driverPhone && (
                                  <span className="ml-2 text-gray-500">
                                    ({trip.driverPhone})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Edit Button - Icon Only */}
                      <div className="flex-shrink-0 ml-3">
                        <button
                          onClick={() => handleEditTrip(trip)}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                          title="Edit trip"
                        >
                          <svg
                            className="w-5 h-5 text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Trip Modal */}
      <CreateEditTripModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSave={handleSaveTrip}
        parkId={parkId}
        drivers={drivers}
        trip={editingTrip || undefined}
        mode={editingTrip ? "edit" : "create"}
      />

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-20 right-4 lg:hidden z-50">
        <button
          onClick={handleCreateTrip}
          className="inline-flex items-center justify-center w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
          aria-label="Create new trip"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
