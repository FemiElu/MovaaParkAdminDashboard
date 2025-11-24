"use client";

import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui/spinner";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";

export default function RevenuePage() {
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
            You need to be authenticated to access the revenue dashboard.
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Revenue Management
            </h1>
            <p className="text-gray-600">
              Track earnings, manage payouts, and analyze financial performance
            </p>
          </div>

          {/* Coming Soon Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-8 lg:p-12 text-center">
              <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CurrencyDollarIcon className="h-12 w-12 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Revenue Dashboard Coming Soon
              </h2>

              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                We&apos;re building a comprehensive revenue management system to
                help you track earnings, manage driver payouts, and gain
                valuable financial insights for your park operations.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  Features Coming Soon
                </h3>
                <ul className="text-left text-green-800 space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                    Real-time revenue tracking and reporting
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                    Driver payout management and scheduling
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                    Financial analytics and profit margins
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                    Expense tracking and cost analysis
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                    Tax reporting and financial statements
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                    Automated invoice generation
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <p className="text-sm text-gray-500">
                  This feature is currently in development. We&apos;ll notify
                  you when it&apos;s ready!
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
