"use client";

interface BookingStatsProps {
  stats: {
    total: number;
    reserved: number;
    confirmed: number;
    expired: number;
    cancelled: number;
    completed: number;
    todayRevenue: number;
  };
}

export function BookingStats({ stats }: BookingStatsProps) {
  const activeBookings = stats.reserved + stats.confirmed;
  const completionRate =
    stats.total > 0
      ? (stats.confirmed /
          (stats.confirmed + stats.expired + stats.cancelled)) *
        100
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Today's Revenue */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">₦</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">
              Today&apos;s Revenue
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              ₦{stats.todayRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Active Bookings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">🎫</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Active Bookings</p>
            <p className="text-2xl font-semibold text-gray-900">
              {activeBookings}
            </p>
            <div className="flex space-x-4 text-xs text-gray-500 mt-1">
              <span>{stats.reserved} Reserved</span>
              <span>{stats.confirmed} Confirmed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">%</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Success Rate</p>
            <p className="text-2xl font-semibold text-gray-900">
              {completionRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Bookings confirmed</p>
          </div>
        </div>
      </div>

      {/* Total Bookings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">#</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Bookings</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.total}
            </p>
            <div className="flex space-x-2 text-xs text-gray-500 mt-1">
              {stats.expired > 0 && <span>{stats.expired} Expired</span>}
              {stats.cancelled > 0 && <span>{stats.cancelled} Cancelled</span>}
              {stats.completed > 0 && <span>{stats.completed} Completed</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



