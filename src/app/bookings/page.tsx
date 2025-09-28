import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { TripBookingsManager } from "@/components/bookings/trip-bookings-manager";
import { ConsolidatedBookingStats } from "@/components/bookings/consolidated-booking-stats";
import { tripsStore } from "@/lib/trips-store";

export default async function LiveBookingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <DashboardSidebar />

      {/* Mobile Header */}
      <MobileHeader user={session.user} />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Desktop Header */}
        <DashboardHeader user={session.user} />

        {/* Content with mobile bottom padding */}
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          {/* Consolidated Stats */}
          <ConsolidatedBookingStats parkId={session.user.parkId || ""} />

          {/* Trip Bookings Manager */}
          <TripBookingsManager
            parkId={session.user.parkId || ""}
            drivers={tripsStore.getDrivers(session.user.parkId || "")}
          />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
