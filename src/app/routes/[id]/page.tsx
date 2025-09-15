import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { listDrivers } from "@/lib/drivers-store";
import { RouteConfig, Driver } from "@/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EditBaseFareClient from "./EditBaseFareClient";
import { listRoutes, getRoute as getRouteFromStore } from "@/lib/routes-store";

// Ensure this page is always rendered dynamically (session-dependent)
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteDetailPageProps {
  params: { id: string };
}

export default async function RouteDetailPage({
  params,
}: RouteDetailPageProps) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;
  const parkId = session?.user.parkId ?? "lekki-phase-1-motor-park";

  // Get route directly from store instead of API call to avoid session issues
  const route: RouteConfig | undefined = getRouteFromStore(resolvedParams.id);

  // Debug logging
  console.log("Route detail page - params.id:", resolvedParams.id);
  console.log("Route detail page - parkId:", parkId);
  console.log("Route detail page - found route:", route);

  // Debug: Let's see all routes for this park
  const allRoutesForPark = listRoutes(parkId);
  console.log("Route detail page - all routes for park:", allRoutesForPark);

  if (!route) {
    // Get all routes for debugging
    const allRoutes = listRoutes(parkId);
    console.log(
      "Route detail page - route not found, available routes:",
      allRoutes.map((r: RouteConfig) => ({
        id: r.id,
        destination: r.destination,
      }))
    );
    return (
      <div className="p-4">
        Route not found. Looking for ID: {resolvedParams.id}
        <br />
        <br />
        Available routes:
        <ul className="mt-2">
          {allRoutes.map((r: RouteConfig) => (
            <li key={r.id} className="text-sm">
              {r.id} - {r.destination}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Get drivers directly from store
  const driversResponse = listDrivers(parkId);
  const allDrivers: Driver[] = Array.isArray(driversResponse)
    ? driversResponse
    : driversResponse.data || [];
  const drivers: Driver[] = allDrivers.filter(
    (d: Driver) => d.qualifiedRoute === route.destination
  );

  // TODO: restrict editing base fare if there are active bookings

  return (
    <main className="p-4 max-w-4xl mx-auto">
      {/* Breadcrumb */}
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
              href="/routes"
              className="hover:text-[var(--primary)] transition-colors"
            >
              Routes
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
              {route.destination}
            </span>
          </li>
        </ol>
      </nav>

      <div className="flex items-center gap-4 mb-6">
        <BackButton href="/routes" />
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {route.destination}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Status:{" "}
            <span
              className={route.isActive ? "text-green-700" : "text-gray-500"}
            >
              {route.isActive ? "Active" : "Inactive"}
            </span>
          </p>
        </div>
      </div>

      {/* Editable Base Fare */}
      <EditBaseFareClient route={route} />

      {/* Drivers Table */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Drivers for this Route
        </h2>
        {drivers.length === 0 ? (
          <div className="text-gray-500 text-sm py-8 text-center">
            No drivers assigned to this route yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Phone
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    License Number
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Seat Capacity
                  </th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id} className="border-t">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {driver.name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {driver.phone}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {driver.licenseNumber}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span
                        className={
                          driver.isActive ? "text-green-700" : "text-gray-500"
                        }
                      >
                        {driver.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {route.vehicleCapacity} seats
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
