"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardStats } from "@/types";

interface DashboardOverviewProps {
  parkId?: string;
}

export function DashboardOverview({ parkId }: DashboardOverviewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Mock data for development
    // In production, this would fetch real data
    const mockStats: DashboardStats = {
      todayBookings: 12,
      todayRevenue: 45000,
      activeRoutes: 5,
      totalDrivers: 8,
      weeklyBookings: [8, 12, 15, 10, 18, 22, 16],
      weeklyRevenue: [32000, 45000, 56000, 38000, 67000, 82000, 59000],
      topRoutes: [
        { destination: "Ibadan", bookings: 45, revenue: 180000 },
        { destination: "Abuja", bookings: 38, revenue: 228000 },
        { destination: "Port Harcourt", bookings: 22, revenue: 132000 },
      ],
    };

    setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  }, [parkId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">B</span>
              </div>
            </div>
            <div className="ml-4 min-w-0">
              <p className="text-sm font-medium text-gray-600">
                Today&apos;s Bookings
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl leading-tight font-semibold text-gray-900">
                {stats.todayBookings}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">₦</span>
              </div>
            </div>
            <div className="ml-4 min-w-0">
              <p className="text-sm font-medium text-gray-600">
                Today&apos;s Revenue
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl leading-tight font-semibold text-gray-900">
                ₦{stats.todayRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">R</span>
              </div>
            </div>
            <div className="ml-4 min-w-0">
              <p className="text-sm font-medium text-gray-600">Active Routes</p>
              <p className="text-xl sm:text-2xl lg:text-3xl leading-tight font-semibold text-gray-900">
                {stats.activeRoutes}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">D</span>
              </div>
            </div>
            <div className="ml-4 min-w-0">
              <p className="text-sm font-medium text-gray-600">Total Drivers</p>
              <p className="text-xl sm:text-2xl lg:text-3xl leading-tight font-semibold text-gray-900">
                {stats.totalDrivers}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Routes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Top Routes This Month
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {stats.topRoutes.map((route, index) => (
              <div
                key={route.destination}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-900 w-4">
                    {index + 1}.
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {route.destination}
                    </p>
                    <p className="text-xs text-gray-500">
                      {route.bookings} bookings
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ₦{route.revenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    ₦
                    {Math.round(
                      route.revenue / route.bookings
                    ).toLocaleString()}
                    /booking
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => router.push("/routes")}
              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-left transition-colors"
              aria-label="Add New Route"
            >
              <h4 className="text-sm font-medium text-blue-900">
                Add New Route
              </h4>
              <p className="text-xs text-blue-700 mt-1">
                Configure destination and pricing
              </p>
            </button>

            <button
              type="button"
              onClick={() => router.push("/drivers/create")}
              className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-left transition-colors"
              aria-label="Add Driver"
            >
              <h4 className="text-sm font-medium text-green-900">Add Driver</h4>
              <p className="text-xs text-green-700 mt-1">
                Register new driver profile
              </p>
            </button>

            <button
              type="button"
              onClick={() => router.push("/trips")}
              className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 text-left transition-colors"
              aria-label="Schedule Trip"
            >
              <h4 className="text-sm font-medium text-purple-900">
                Schedule Trip
              </h4>
              <p className="text-xs text-purple-700 mt-1">
                Assign driver to route
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
