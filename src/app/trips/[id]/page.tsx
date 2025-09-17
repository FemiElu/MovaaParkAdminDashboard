import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { tripsStore } from "@/lib/trips-store";
import { BackButton } from "@/components/ui/back-button";
import Link from "next/link";
import { TripDetailTabs } from "@/components/trips/trip-detail-tabs";
import { AssignDriverModal } from "@/components/trips/assign-driver-modal";
import { AssignParcelsModal } from "@/components/trips/assign-parcels-modal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;

  if (!session) {
    return <div>Please log in to view this page.</div>;
  }

  const trip = tripsStore.getTrip(resolvedParams.id);
  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />
        <MobileHeader user={session.user} />
        <div className="lg:pl-64">
          <DashboardHeader user={session.user} />
          <main className="p-4 lg:p-6 pb-20 lg:pb-6">
            <div className="text-center py-8">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Trip not found
              </h1>
              <p className="text-gray-600 mb-4">
                The trip you&apos;re looking for doesn&apos;t exist.
              </p>
              <Link
                href="/trips"
                className="text-green-600 hover:text-green-700"
              >
                ← Back to Trips
              </Link>
            </div>
          </main>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  const parkId = session.user.parkId ?? "lekki-phase-1-motor-park";
  const vehicles = tripsStore.getVehicles(parkId);
  const drivers = tripsStore.getDrivers(parkId);
  const bookings = tripsStore.getBookings(trip.id);
  const parcels = tripsStore.getParcels(trip.id);

  const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
  const driver = drivers.find((d) => d.id === trip.driverId);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <MobileHeader user={session.user} />
      <div className="lg:pl-64">
        <DashboardHeader user={session.user} />
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          {/* Breadcrumb Navigation */}
          <nav className="mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <Link
                  href="/"
                  className="hover:text-green-600 transition-colors"
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
                  href="/trips"
                  className="hover:text-green-600 transition-colors"
                >
                  Trips
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
                  {trip.routeId} - {trip.date}
                </span>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <BackButton href="/trips" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Trip Details
              </h1>
              <p className="text-gray-600 mt-1">
                {trip.routeId} • {trip.date} at {trip.unitTime}
              </p>
            </div>
          </div>

          {/* Trip Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Vehicle</h3>
              <p className="text-lg font-semibold text-gray-900">
                {vehicle?.name || "Unknown"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Driver</h3>
              <p className="text-lg font-semibold text-gray-900">
                {driver?.name || "Unassigned"}
              </p>
              <div className="mt-3">
                <AssignDriverModal parkId={parkId} tripId={trip.id} />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Passengers</h3>
              <p className="text-lg font-semibold text-gray-900">
                {trip.confirmedBookingsCount} / {trip.seatCount}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Parcels</h3>
              <p className="text-lg font-semibold text-gray-900">
                {parcels.length} / {trip.maxParcelsPerVehicle}
              </p>
              <div className="mt-3">
                <AssignParcelsModal
                  parkId={parkId}
                  tripId={trip.id}
                  maxParcels={trip.maxParcelsPerVehicle}
                />
              </div>
            </div>
          </div>

          {/* Trip Detail Tabs */}
          <TripDetailTabs
            trip={trip}
            vehicle={vehicle}
            driver={driver}
            bookings={bookings}
            parcels={parcels}
          />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
