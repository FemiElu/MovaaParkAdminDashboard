"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { TripBookingsManagerV2 as TripBookingsManager } from "@/components/bookings/trip-bookings-manager-v2";
import { ConsolidatedBookingStats } from "@/components/bookings/consolidated-booking-stats";
import { tripsStore } from "@/lib/trips-store";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function LiveBookingsPage() {
  const { user } = useAuth();
  const parkId = user?.parkId ?? "";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <DashboardSidebar />

        {/* Mobile Header */}
        <MobileHeader />

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Desktop Header */}
          <DashboardHeader />

          {/* Content with mobile bottom padding */}
          <main className="p-4 lg:p-6 pb-20 lg:pb-6">
            {/* Consolidated Stats */}
            <ConsolidatedBookingStats parkId={parkId} />

            {/* Trip Bookings Manager */}
            <TripBookingsManager
              parkId={parkId}
              drivers={tripsStore.getDrivers(parkId)}
            />
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </AuthGuard>
  );
}
