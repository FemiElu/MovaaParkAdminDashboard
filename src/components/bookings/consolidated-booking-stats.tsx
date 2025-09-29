"use client";

import { tripsStore } from "@/lib/trips-store";
import { useMemo } from "react";

interface ConsolidatedBookingStatsProps {
  parkId: string;
}

export function ConsolidatedBookingStats({
  parkId,
}: ConsolidatedBookingStatsProps) {
  // Get today's date
  const today = new Date().toISOString().split("T")[0];
  const departureTime = "06:00";

  // Calculate stats for today's trips
  const stats = useMemo(() => {
    const todayTrips = tripsStore
      .getTrips(parkId, today)
      .filter((trip) => trip.unitTime === departureTime);

    const totalBookings = todayTrips.reduce((sum, trip) => {
      const bookings = tripsStore.getBookings(trip.id);
      return sum + bookings.length;
    }, 0);

    const totalRevenue = todayTrips.reduce((sum, trip) => {
      const bookings = tripsStore.getBookings(trip.id);
      return (
        sum +
        bookings.reduce(
          (bookingSum, booking) => bookingSum + booking.amountPaid,
          0
        )
      );
    }, 0);

    return {
      activeBookings: todayTrips.length,
      totalPassengers: totalBookings,
      todayRevenue: totalRevenue,
    };
  }, [parkId, today]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
      {/* Active Bookings */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">🚌</span>
            </div>
          </div>
          <div className="ml-4 min-w-0">
            <p className="text-sm font-medium text-gray-600">Active Bookings</p>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight">
              {stats.activeBookings}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Trips scheduled for today
            </p>
          </div>
        </div>
      </div>

      {/* Today's Revenue */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">₦</span>
            </div>
          </div>
          <div className="ml-4 min-w-0">
            <p className="text-sm font-medium text-gray-600">
              Today&apos;s Revenue
            </p>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight">
              ₦{stats.todayRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              From today&apos;s trips
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
