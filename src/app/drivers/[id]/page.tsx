import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import DriverDetail from "@/components/drivers/driver-detail";
import { getDriver, listDrivers } from "@/lib/drivers-store";
import { BackButton } from "@/components/ui/back-button";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";

// Ensure this page is always rendered dynamically (session-dependent)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;
  const parkId = session?.user.parkId ?? "lekki-phase-1-motor-park";

  if (!session) {
    return <div>Please log in to view this page.</div>;
  }

  // Debug logging
  console.log("Driver detail page - params.id:", resolvedParams.id);
  console.log("Driver detail page - parkId:", parkId);

  const driver = getDriver(resolvedParams.id);
  console.log("Driver detail page - found driver:", driver);

  // Debug: Let's see what drivers are actually in the store
  const { data: allDrivers } = listDrivers(parkId, {});
  console.log(
    "Driver detail page - all drivers in store:",
    allDrivers.map((d) => ({ id: d.id, name: d.name, parkId: d.parkId }))
  );
  console.log("Driver detail page - looking for driver ID:", resolvedParams.id);
  console.log(
    "Driver detail page - driver exists in list:",
    allDrivers.some((d) => d.id === resolvedParams.id)
  );
  if (!driver) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />
        <MobileHeader user={session.user} />
        <div className="lg:pl-64">
          <DashboardHeader user={session.user} />
          <main className="p-4 lg:p-6 pb-20 lg:pb-6">
            <div className="p-4">Driver not found</div>
          </main>
        </div>
        <MobileBottomNav />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <MobileHeader user={session.user} />
      <div className="lg:pl-64">
        <DashboardHeader user={session.user} />
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          {/* Breadcrumb Navigation */}
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <Link
                  href="/"
                  className="hover:text-[var(--primary)] transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 mx-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <Link
                  href="/drivers"
                  className="hover:text-[var(--primary)] transition-colors"
                >
                  Drivers
                </Link>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 mx-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-900 font-medium">{driver.name}</span>
              </li>
            </ol>
          </nav>

          <div className="flex items-center gap-4 mb-6">
            <BackButton href="/drivers" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Driver Details
              </h1>
              <p className="text-sm text-gray-600 mt-1">{driver.name}</p>
            </div>
          </div>
          <DriverDetail driver={driver} />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
