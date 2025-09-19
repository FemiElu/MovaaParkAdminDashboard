import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { tripsStore } from "@/lib/trips-store";
import { TripsPageClient } from "@/components/trips/trips-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TripsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <div>Please log in to view this page.</div>;
  }

  const parkId = session.user.parkId ?? "lekki-phase-1-motor-park";
  const vehicles = tripsStore.getVehicles(parkId);
  const drivers = tripsStore.getDrivers(parkId);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <MobileHeader user={session.user} />
      <div className="lg:pl-64">
        <DashboardHeader user={session.user} />
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Trip Management
            </h1>
            <p className="text-gray-600">
              Manage and monitor your park&apos;s trip schedules
            </p>
          </div>

          {/* Client Component for Interactive Features */}
          <TripsPageClient
            parkId={parkId}
            vehicles={vehicles}
            drivers={drivers}
          />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
