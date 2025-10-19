"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { RoutesManager } from "@/components/routes/routes-manager";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function RoutesPage() {
  const { user } = useAuth();
  const parkId = user?.parkId ?? "lekki-phase-1-motor-park";

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
            <div className="mb-6">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                Routes Management
              </h1>
              <p className="text-sm lg:text-base text-gray-600">
                Set destinations, pricing, and vehicle capacity
              </p>
            </div>
            <RoutesManager parkId={parkId} />
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </AuthGuard>
  );
}
