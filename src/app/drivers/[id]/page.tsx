"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import DriverDetail from "@/components/drivers/driver-detail";
import { BackButton } from "@/components/ui/back-button";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { driverApiService } from "@/lib/driver-api-service";
import { Driver } from "@/types";
import { AuthGuard } from "@/components/auth/auth-guard";

interface DriverDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function DriverDetailPage({ params }: DriverDetailPageProps) {
  const { user } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);

  // Resolve params
  useEffect(() => {
    params.then((resolvedParams) => {
      setDriverId(resolvedParams.id);
    });
  }, [params]);

  // Fetch driver details using workaround (list endpoint since individual endpoint is broken)
  useEffect(() => {
    if (!driverId) return;

    async function fetchDriver() {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching driver details for ID:", driverId);

        // TEMPORARY WORKAROUND: Use list endpoint since individual endpoint returns empty data
        const response = await driverApiService.getAllDrivers();
        console.log("Drivers list API response:", response);

        if (response.success && response.data) {
          const driversArray = response.data || [];

          console.log("All drivers from list:", driversArray);

          // Find the specific driver by ID
          const foundDriver = driversArray.find((d) => d.user.id === driverId);

          if (foundDriver) {
            console.log("Found driver in list:", foundDriver);

            // Convert API driver format to expected format
            const convertedDriver: Driver = {
              id: foundDriver.user.id,
              parkId: user?.parkId || "default-park",
              name:
                `${foundDriver.user.first_name || ""} ${
                  foundDriver.user.last_name || ""
                }`.trim() || "Unknown Driver",
              phone: foundDriver.user.phone_number || "Unknown",
              licenseNumber: "N/A", // No license number in this response structure
              licenseExpiry: undefined,
              qualifiedRoute: "N/A", // No route info in this response structure
              isActive: foundDriver.user.is_active ?? true,
              rating: undefined,
              vehiclePlateNumber: foundDriver.plate_number,
              address: foundDriver.address,
              photo: foundDriver.user.avatar || undefined,
              documents: undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            console.log("Converted driver:", convertedDriver);
            setDriver(convertedDriver);
          } else {
            console.error("Driver not found in list");
            setError("Driver not found");
          }
        } else {
          console.error("Failed to fetch drivers list:", response);
          setError(response.error || "Failed to fetch driver details");
        }
      } catch (err) {
        console.error("Error fetching driver:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch driver details"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDriver();
  }, [driverId, user?.parkId]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <DashboardSidebar />
          <MobileHeader />
          <div className="lg:pl-64">
            <DashboardHeader />
            <main className="p-4 lg:p-6 pb-20 lg:pb-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading driver details...</p>
                </div>
              </div>
            </main>
          </div>
          <MobileBottomNav />
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <DashboardSidebar />
          <MobileHeader />
          <div className="lg:pl-64">
            <DashboardHeader />
            <main className="p-4 lg:p-6 pb-20 lg:pb-6">
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Error Loading Driver
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Link
                  href="/drivers"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--primary)] hover:bg-[var(--primary-dark)]"
                >
                  Back to Drivers
                </Link>
              </div>
            </main>
          </div>
          <MobileBottomNav />
        </div>
      </AuthGuard>
    );
  }

  if (!driver) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <DashboardSidebar />
          <MobileHeader />
          <div className="lg:pl-64">
            <DashboardHeader />
            <main className="p-4 lg:p-6 pb-20 lg:pb-6">
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2h5m4-4V4m0 0L7 7m4-3l4 3"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Driver Not Found
                </h3>
                <p className="text-gray-600 mb-4">
                  The requested driver could not be found.
                </p>
                <Link
                  href="/drivers"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--primary)] hover:bg-[var(--primary-dark)]"
                >
                  Back to Drivers
                </Link>
              </div>
            </main>
          </div>
          <MobileBottomNav />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />
        <MobileHeader />
        <div className="lg:pl-64">
          <DashboardHeader />
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
                  <span className="text-gray-900 font-medium">
                    {driver.name}
                  </span>
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
    </AuthGuard>
  );
}
