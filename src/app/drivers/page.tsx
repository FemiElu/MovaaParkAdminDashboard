"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import DriversPageClient from "./drivers-page-client";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function DriversPage() {
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
            <DriversPageClient parkId={parkId} />
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </AuthGuard>
  );
}
