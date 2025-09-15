import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import DriversPageClient from "./drivers-page-client";

// Ensure this page is always rendered dynamically (session-dependent)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DriversPage() {
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
          <DriversPageClient
            parkId={session.user.parkId ?? "lekki-phase-1-motor-park"}
          />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
