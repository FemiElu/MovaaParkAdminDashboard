"use client";

import React, { useState, useEffect, useCallback } from "react";
import { bookingApiService, BackendBooking } from "@/lib/booking-api-service";
import { tripApiService } from "@/lib/trip-api-service";
import { routeApiService } from "@/lib/route-api-service";
import { Booking, RouteConfig } from "@/types";
import { BookingSearchModal } from "./booking-search-modal";
import { RouteTabs } from "../trips/route-tabs";
import { DateTimeSelector } from "../trips/date-time-selector";

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

interface TripBookingsManagerV2Props {
  parkId: string;
}

export function TripBookingsManagerV2({ parkId }: TripBookingsManagerV2Props) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Fetch routes on mount
  useEffect(() => {
    (async () => {
      const response = await routeApiService.getAllRoutes();
      if (response.success && response.data) {
        setRoutes(
          response.data.map(
            (route: {
              id: string;
              to_city: string;
              to_state: string;
              from_state: string;
              created_at?: string;
              updated_at?: string;
            }) => ({
              id: route.id,
              parkId: parkId || "default-park",
              destination: route.to_city,
              destinationPark: route.to_state,
              from_state: route.from_state,
              isActive: true,
              createdAt: route.created_at || new Date().toISOString(),
              updatedAt: route.updated_at || new Date().toISOString(),
            })
          )
        );
      }
    })();
  }, [parkId]);

  // Fetch all bookings for trips on selected date/route
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setAllBookings([]);
    const tripResp = await tripApiService.getAllTrips();
    if (!tripResp.success || !Array.isArray(tripResp.data)) {
      setLoading(false);
      return;
    }
    let trips: BackendTrip[] = tripResp.data as BackendTrip[];
    // Filter by date
    if (selectedDate)
      trips = trips.filter((trip) => trip.departure_date === selectedDate);
    // Filter by route
    if (selectedRouteId)
      trips = trips.filter((trip) => trip.to_route?.id === selectedRouteId);
    // If no trips, nothing to do
    if (trips.length === 0) {
      setLoading(false);
      setAllBookings([]);
      return;
    }
    // Fetch bookings for each trip
    const bookingsResults: Booking[][] = await Promise.all<Booking[]>(
      trips.map(async (trip: BackendTrip): Promise<Booking[]> => {
        const res = await bookingApiService.getTripBookings(trip.id);
        if (!res.success || !Array.isArray(res.data)) return [] as Booking[];
        return (res.data as BackendBooking[]).map((bk: BackendBooking) =>
          bookingApiService.convertBackendBookingToFrontend(bk)
        );
      })
    );
    // Merge into a single array
    const merged: Booking[] = ([] as Booking[]).concat(...bookingsResults);
    setAllBookings(merged);
    setLoading(false);
  }, [selectedDate, selectedRouteId]);

  // Fetch bookings whenever date/route changes
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Table column renderers (show all requested info)
  const columns = [
    { label: "Name", get: (b: Booking) => b.passengerName },
    { label: "Phone", get: (b: Booking) => b.passengerPhone },
    { label: "Trip", get: (b: Booking) => b.trip?.toRoute?.toCity || "-" },
    { label: "Date", get: (b: Booking) => b.trip?.departureDate || "-" },
    { label: "Time", get: (b: Booking) => b.trip?.departureTime || "-" },
    { label: "Seat", get: (b: Booking) => b.seatNumber },
    { label: "Payment", get: (b: Booking) => b.paymentStatus?.toUpperCase() },
    { label: "Check-in", get: (b: Booking) => (b.isCheckedIn ? "✓" : "-") },
    { label: "NoK Name", get: (b: Booking) => b.nokName },
    { label: "NoK Phone", get: (b: Booking) => b.nokPhone },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">All Bookings</h2>
        <button
          onClick={() => setShowSearchModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-colors duration-200 shadow-sm"
        >
          Search Passengers
        </button>
      </div>
      <DateTimeSelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
      <RouteTabs
        routes={routes}
        selectedRouteId={selectedRouteId}
        onRouteSelect={setSelectedRouteId}
      />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-4">
        {loading ? (
          <div className="text-center py-12">Loading bookings...</div>
        ) : allBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No bookings for this date/route
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.label}
                        className="px-4 py-2 text-xs font-medium text-gray-700"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {allBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-green-50">
                      {columns.map((col) => (
                        <td key={col.label} className="px-4 py-2 text-sm">
                          {col.get(b)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {allBookings.map((b) => (
                <div key={b.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {b.passengerName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {b.passengerPhone}
                      </div>
                    </div>
                    <div
                      className={`text-xs font-medium ${
                        b.isCheckedIn ? "text-green-600" : "text-orange-600"
                      }`}
                    >
                      {b.isCheckedIn ? "Checked In" : "Pending"}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <div className="text-gray-500">Route</div>
                      <div>{b.trip?.toRoute?.toCity || "-"}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Seat</div>
                      <div>{b.seatNumber}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Date</div>
                      <div>{b.trip?.departureDate || "-"}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Time</div>
                      <div>{b.trip?.departureTime || "-"}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Payment</div>
                      <div>{b.paymentStatus?.toUpperCase() || "-"}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Ticket</div>
                      <div>{b.bookingId || "-"}</div>
                    </div>
                  </div>
                  {(b.nokName || b.nokPhone) && (
                    <div className="mt-2 text-xs text-gray-600">
                      <div className="text-gray-500">NoK</div>
                      <div>
                        {b.nokName} {b.nokPhone ? `• ${b.nokPhone}` : ""}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {showSearchModal && (
        <BookingSearchModal
          bookings={allBookings}
          onClose={() => setShowSearchModal(false)}
          onBookingFound={() => {}}
        />
      )}
    </div>
  );
}
