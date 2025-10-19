"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { TripsPageClient } from "@/components/trips/trips-page-client";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function TripsPage() {
  const { user } = useAuth();
  const parkId = user?.parkId ?? "lekki-phase-1-motor-park";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />
        <MobileHeader />
        <div className="lg:pl-64">
          <DashboardHeader />
          <main className="p-4 lg:p-6 pb-20 lg:pb-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Trip Management
              </h1>
              <p className="text-gray-600">
                Manage your park&apos;s trip schedules
              </p>
            </div>

            {/* Client Component for Interactive Features */}
            <TripsPageClient parkId={parkId} />
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </AuthGuard>
  );
}
