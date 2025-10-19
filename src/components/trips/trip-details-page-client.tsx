"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { TripDetailsClient } from "./trip-details-client";
import { RefreshCw } from "lucide-react";

interface TripDetailsPageClientProps {
  tripId: string;
}

export function TripDetailsPageClient({ tripId }: TripDetailsPageClientProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading state while checking authentication
  if (isLoading || !isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    router.push("/auth/login");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const parkId = user.parkId ?? "lekki-phase-1-motor-park";

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <MobileHeader />
      <div className="lg:pl-64">
        <DashboardHeader />
        <TripDetailsClient tripId={tripId} parkId={parkId} />
      </div>
      <MobileBottomNav />
    </div>
  );
}
