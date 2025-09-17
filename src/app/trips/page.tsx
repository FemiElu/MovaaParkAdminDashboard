import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { tripsStore } from "@/lib/trips-store";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TripsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <div>Please log in to view this page.</div>;
  }

  const parkId = session.user.parkId ?? "lekki-phase-1-motor-park";
  const trips = tripsStore.getTrips(parkId);
  const vehicles = tripsStore.getVehicles(parkId);
  const drivers = tripsStore.getDrivers(parkId);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <MobileHeader user={session.user} />
      <div className="lg:pl-64">
        <DashboardHeader user={session.user} />
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          <h1 className="text-2xl font-bold mb-6">Trip Scheduling</h1>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Total Trips</h3>
              <p className="text-2xl font-bold text-green-600">
                {trips.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">
                Available Vehicles
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {vehicles.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">
                Available Drivers
              </h3>
              <p className="text-2xl font-bold text-purple-600">
                {drivers.length}
              </p>
            </div>
          </div>

          {/* Trips List */}
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Upcoming Trips</h2>
            </div>
            <div className="p-6">
              {trips.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No trips scheduled yet
                </div>
              ) : (
                <div className="space-y-4">
                  {trips.slice(0, 10).map((trip) => {
                    const route = {
                      id: trip.routeId,
                      destination: trip.routeId,
                    };
                    const vehicle = vehicles.find(
                      (v) => v.id === trip.vehicleId
                    );
                    const driver = drivers.find((d) => d.id === trip.driverId);
                    const bookings = tripsStore.getBookings(trip.id);

                    return (
                      <Link
                        key={trip.id}
                        href={`/trips/${trip.id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div>
                                <h3 className="font-medium">
                                  {route.destination}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {trip.date} at {trip.unitTime}
                                </p>
                              </div>
                              <div className="text-sm text-gray-500">
                                Vehicle: {vehicle?.name || "Unknown"}
                              </div>
                              <div className="text-sm text-gray-500">
                                Driver: {driver?.name || "Unassigned"}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {trip.confirmedBookingsCount} / {trip.seatCount}{" "}
                              seats
                            </div>
                            <div className="text-xs text-gray-500">
                              {bookings.length} bookings
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
