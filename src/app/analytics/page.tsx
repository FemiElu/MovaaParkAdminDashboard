"use client";

import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui/spinner";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";

export default function AnalyticsPage() {
  const { user, isLoading, isAuthenticated, loadUser } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !user) {
      loadUser();
    }
  }, [isAuthenticated, user, loadUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to view this page
          </h2>
          <p className="text-gray-600">
            You need to be authenticated to access the analytics dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <MobileHeader />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
            <p className="text-gray-600">
              Comprehensive insights and performance metrics
            </p>
          </div>

          {/* Coming Soon Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-8 lg:p-12 text-center">
              <div className="mx-auto h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <ChartBarIcon className="h-12 w-12 text-blue-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Analytics Dashboard Coming Soon
              </h2>

              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                We&apos;re working hard to bring you comprehensive analytics and
                insights for your park operations. This will include trip
                performance metrics, revenue analytics, passenger trends, and
                much more.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  What to Expect
                </h3>
                <ul className="text-left text-blue-800 space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                    Trip performance and utilization metrics
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                    Revenue trends and financial insights
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                    Passenger booking patterns and preferences
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                    Driver performance and efficiency metrics
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                    Route profitability analysis
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <p className="text-sm text-gray-500">
                  Stay tuned for updates! We&apos;ll notify you when this
                  feature is ready.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
