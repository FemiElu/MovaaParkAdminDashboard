"use client";

import { useState, useEffect, useCallback } from "react";
import { LiveBooking } from "@/lib/live-bookings";
import { BookingCard } from "./booking-card";
import { BookingFilters } from "./booking-filters";
import { BookingDetailsModal } from "./booking-details-modal";
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface LiveBookingsManagerProps {
  parkId?: string;
}

interface BookingsData {
  bookings: LiveBooking[];
  stats: {
    total: number;
    reserved: number;
    confirmed: number;
    expired: number;
    cancelled: number;
    completed: number;
    todayRevenue: number;
  };
  lastModified: number;
  total: number;
}

export function LiveBookingsManager({ parkId }: LiveBookingsManagerProps) {
  const [data, setData] = useState<BookingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<LiveBooking | null>(
    null
  );
  const [lastPolled, setLastPolled] = useState<number>(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [routeFilter, setRouteFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("today");

  // Fetch bookings with smart polling
  const fetchBookings = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);

      try {
        const params = new URLSearchParams();
        if (parkId) params.append("parkId", parkId);
        if (statusFilter !== "all")
          params.append("status", statusFilter.toUpperCase());
        if (dateFilter === "today") {
          params.append("date", new Date().toISOString().split("T")[0]);
        }
        // Smart polling: only fetch if data changed
        if (lastPolled > 0) {
          params.append("modifiedAfter", lastPolled.toString());
        }

        const response = await fetch(`/api/bookings/live?${params}`);
        if (!response.ok) throw new Error("Failed to fetch bookings");

        const result = await response.json();

        if (result.success) {
          // If smart polling returns no new data, keep existing data
          if (lastPolled > 0 && result.data.bookings.length === 0) {
            setLastPolled(Date.now());
            return;
          }

          setData(result.data);
          setLastPolled(Date.now());
          setError(null);
        } else {
          setError(result.error || "Failed to fetch bookings");
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Network error - check your connection");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [parkId, statusFilter, dateFilter, lastPolled]
  );

  // Initial load
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchBookings();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchBookings, loading, refreshing]);

  // Filter bookings based on search and route
  const filteredBookings =
    data?.bookings.filter((booking) => {
      const matchesSearch =
        !searchQuery ||
        booking.passenger.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        booking.passenger.phone.includes(searchQuery) ||
        booking.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRoute =
        routeFilter === "all" || booking.destination === routeFilter;

      return matchesSearch && matchesRoute;
    }) || [];

  // Get unique routes for filter
  const availableRoutes = Array.from(
    new Set(data?.bookings.map((b) => b.destination) || [])
  ).sort();

  // Manual refresh
  const handleRefresh = () => {
    setLastPolled(0); // Force full refresh
    fetchBookings(true);
  };

  if (loading && !data) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Connection Error
            </h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={handleRefresh}
              className="text-sm text-red-800 hover:text-red-900 font-medium mt-2"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-lg lg:text-xl font-medium text-gray-900">
            Live Bookings ({filteredBookings.length})
          </h2>
          <p className="text-sm text-gray-600">
            Last updated:{" "}
            {lastPolled ? new Date(lastPolled).toLocaleTimeString() : "Never"}
            {refreshing && (
              <span className="text-blue-600 ml-2">• Updating...</span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <BookingFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        routeFilter={routeFilter}
        onRouteFilterChange={setRouteFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        availableRoutes={availableRoutes}
      />

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900">
            No bookings found
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery || routeFilter !== "all"
              ? "Try adjusting your filters"
              : "Bookings will appear here when passengers make reservations"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onClick={() => setSelectedBooking(booking)}
            />
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdate={(updatedBooking) => {
            // Update the booking in the list
            if (data) {
              const updatedBookings = data.bookings.map((b) =>
                b.id === updatedBooking.id ? updatedBooking : b
              );
              setData({ ...data, bookings: updatedBookings });
            }
            setSelectedBooking(updatedBooking);
          }}
        />
      )}
    </div>
  );
}
