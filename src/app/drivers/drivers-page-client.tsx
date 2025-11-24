"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DriverList from "@/components/drivers/driver-list";
import { RouteTabs } from "@/components/drivers/route-tabs";
import { DriverSearch } from "@/components/drivers/driver-search";
import { DriverPagination } from "@/components/drivers/driver-pagination";
import { Driver, RouteConfig } from "@/types";
import { driverApiService } from "@/lib/driver-api-service";
import { routeApiService } from "@/lib/route-api-service";

interface DriversPageClientProps {
  parkId: string;
}

export default function DriversPageClient({ parkId }: DriversPageClientProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering and pagination state
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null); // null = "All"
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch routes first, then drivers
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch routes first
        const routesResponse = await routeApiService.getAllRoutes();
        console.log("Routes API response:", routesResponse);

        let fetchedRoutes: RouteConfig[] = [];
        if (routesResponse.success) {
          // Handle different response formats - backend returns {message: 'Success', data: Array(0), errors: null}
          const routesArray = Array.isArray(routesResponse.data)
            ? routesResponse.data
            : (routesResponse.data as { data?: unknown[] })?.data || [];

          if (routesArray.length === 0) {
            console.log("No routes found - this is normal for a new system");
            fetchedRoutes = [];
          } else {
            // Convert API Route format to RouteConfig format
            const convertedRoutes = routesArray.map((route: unknown) => {
              const r = route as {
                id: string;
                to_city: string;
                to_state: string;
                from_state: string;
                created_at?: string;
                updated_at?: string;
              };

              return {
                id: r.id,
                parkId: parkId || "default-park",
                destination: r.to_city,
                destinationPark: r.to_state,
                from_state: r.from_state,
                isActive: true,
                createdAt: r.created_at || new Date().toISOString(),
                updatedAt: r.updated_at || new Date().toISOString(),
              };
            });
            fetchedRoutes = convertedRoutes;
          }
        } else {
          console.error("Failed to fetch routes:", routesResponse);
          fetchedRoutes = [];
        }

        setRoutes(fetchedRoutes);
        console.log("SET ROUTES:", fetchedRoutes.length, "routes");

        // Now fetch drivers with routes available
        const driversResponse = await driverApiService.getAllDrivers();
        console.log("Drivers API response:", driversResponse);

        if (driversResponse.success) {
          // Handle different response formats - backend returns {message: 'Success', data: Array(0), errors: null}
          const driversArray = Array.isArray(driversResponse.data)
            ? driversResponse.data
            : (driversResponse.data as { data?: unknown[] })?.data || [];

          console.log("Raw drivers array from API:", driversArray);

          if (driversArray.length === 0) {
            console.log("No drivers found - this is normal for a new system");
            setDrivers([]);
          } else {
            // Convert API Driver format to expected Driver format
            const convertedDrivers = driversArray.map((driver: unknown) => {
              const d = driver as {
                user: {
                  id: string;
                  first_name: string;
                  last_name: string;
                  phone_number: string;
                  is_active: boolean;
                  avatar: string;
                };
                plate_number: string;
                address: string;
              };

              console.log("Converting driver:", d);

              // Get the driver's route information from localStorage
              let assignedRoute = "N/A";
              try {
                const rawStorage = localStorage.getItem("driver_routes");
                console.log("=== LOADING DRIVER ROUTE INFO ===");
                console.log("Driver ID:", d.user.id);
                console.log("Raw localStorage:", rawStorage);

                const driverRoutes = JSON.parse(rawStorage || "{}");
                const routeInfo = driverRoutes[d.user.id];

                console.log(
                  `Driver ${d.user.id} route info from storage:`,
                  routeInfo
                );
                console.log(
                  `Available routes:`,
                  fetchedRoutes.map((r) => ({ id: r.id, dest: r.destination }))
                );

                if (routeInfo && routeInfo.routeId) {
                  // Find the route by ID
                  const matchedRoute = fetchedRoutes.find(
                    (r) => r.id === routeInfo.routeId
                  );
                  console.log(
                    `Matching route ID ${routeInfo.routeId}:`,
                    matchedRoute
                  );

                  if (matchedRoute) {
                    assignedRoute = matchedRoute.destination;
                    console.log(
                      `✓ Driver ${d.user.first_name} (${d.user.id}) assigned to route: ${assignedRoute}`
                    );
                  } else {
                    console.log(
                      `✗ Route ID ${routeInfo.routeId} not found in routes list`
                    );
                    // Fallback to first route
                    if (fetchedRoutes.length > 0) {
                      assignedRoute = fetchedRoutes[0].destination;
                      console.log(
                        `Falling back to first route: ${assignedRoute}`
                      );
                    }
                  }
                } else {
                  // No route info in storage - try pending mapping by phone
                  console.log(
                    `✗ No route info for driver ${d.user.first_name} (${d.user.id})`
                  );
                  try {
                    const pendingRaw =
                      localStorage.getItem("driver_routes_by_phone") || "{}";
                    const pending: Record<
                      string,
                      { routeId: string; timestamp: number }
                    > = JSON.parse(pendingRaw);
                    const byPhone = pending[d.user.phone_number];
                    if (byPhone?.routeId) {
                      const matchedRoute = fetchedRoutes.find(
                        (r) => r.id === byPhone.routeId
                      );
                      if (matchedRoute) {
                        assignedRoute = matchedRoute.destination;
                        console.log(
                          `Recovered route by phone for ${d.user.first_name}:`,
                          assignedRoute
                        );
                      }
                    }
                  } catch (e) {
                    console.warn("Failed to read pending route by phone:", e);
                  }

                  // If still not found, fallback to first route
                  if (assignedRoute === "N/A" && fetchedRoutes.length > 0) {
                    assignedRoute = fetchedRoutes[0].destination;
                    console.log(
                      `Falling back to first route: ${assignedRoute}`
                    );
                  }
                }
              } catch (error) {
                console.warn("Error loading driver route info:", error);
                // Fallback to first route
                if (fetchedRoutes.length > 0) {
                  assignedRoute = fetchedRoutes[0].destination;
                  console.log(
                    `Error fallback to first route: ${assignedRoute}`
                  );
                }
              }

              console.log(
                `Final assigned route for ${d.user.first_name}: ${assignedRoute}`
              );

              return {
                id: d.user.id,
                parkId: parkId || "default-park",
                name:
                  `${d.user.first_name || ""} ${d.user.last_name || ""
                    }`.trim() || "Unknown Driver",
                phone: d.user.phone_number || "Unknown",
                licenseNumber: "N/A", // No license number in this response structure
                licenseExpiry: undefined,
                qualifiedRoute: assignedRoute, // Assign route for filtering
                isActive: d.user.is_active ?? true,
                rating: undefined,
                vehiclePlateNumber: d.plate_number,
                address: d.address,
                photo: d.user.avatar || undefined,
                documents: undefined,
                createdAt: new Date().toISOString(), // No created_at in this response
                updatedAt: new Date().toISOString(), // No updated_at in this response
              };
            });
            console.log("Converted drivers:", convertedDrivers);
            setDrivers(convertedDrivers);
          }
        } else {
          console.error("Failed to fetch drivers:", driversResponse);
          setDrivers([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Set empty arrays on error to prevent crashes
        setDrivers([]);
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [parkId]);

  // Calculate driver counts by route
  const driverCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    console.log("=== CALCULATING DRIVER COUNTS ===");
    console.log(
      "Drivers with routes:",
      drivers.map((d) => ({
        name: d.name,
        qualifiedRoute: d.qualifiedRoute,
        id: d.id,
      }))
    );
    console.log(
      "Available routes:",
      routes.map((r) => ({
        id: r.id,
        destination: r.destination,
      }))
    );

    routes.forEach((route) => {
      // Count drivers assigned to this route
      const matchingDrivers = drivers.filter((d) => {
        const matches = d.qualifiedRoute === route.destination;
        if (matches) {
          console.log(
            `✓ Driver "${d.name}" matches route "${route.destination}"`
          );
        }
        return matches;
      });
      counts[route.id] = matchingDrivers.length;
      console.log(
        `Route "${route.destination}" has ${matchingDrivers.length} drivers:`,
        matchingDrivers.map((d) => d.name)
      );
    });

    // Also count "All"
    counts["all"] = drivers.length;
    console.log("Total drivers:", drivers.length);

    console.log("=== FINAL COUNTS ===", counts);
    return counts;
  }, [drivers, routes]);

  // Filter and search drivers
  const filteredDrivers = useMemo(() => {
    let filtered = drivers;
    console.log(
      "Filtering drivers. Selected route ID:",
      selectedRouteId,
      "Search term:",
      searchTerm
    );

    // Filter by selected route
    if (selectedRouteId) {
      const selectedRoute = routes.find((r) => r.id === selectedRouteId);
      console.log("Selected route:", selectedRoute);
      if (selectedRoute) {
        const beforeFilter = filtered.length;
        filtered = filtered.filter((driver) => {
          const matches = driver.qualifiedRoute === selectedRoute.destination;
          console.log(
            `Driver ${driver.name} (${driver.qualifiedRoute}) matches selected route ${selectedRoute.destination}? ${matches}`
          );
          return matches;
        });
        console.log(
          `Filtered from ${beforeFilter} to ${filtered.length} drivers`
        );
      }
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const beforeSearch = filtered.length;
      filtered = filtered.filter(
        (driver) =>
          driver.name.toLowerCase().includes(searchLower) ||
          driver.phone.includes(searchTerm)
      );
      console.log(
        `Search filtered from ${beforeSearch} to ${filtered.length} drivers`
      );
    }

    console.log(
      "Final filtered drivers:",
      filtered.map((d) => ({ name: d.name, qualifiedRoute: d.qualifiedRoute }))
    );
    return filtered;
  }, [drivers, selectedRouteId, routes, searchTerm]);

  // Paginate filtered drivers
  const paginatedDrivers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDrivers.slice(startIndex, endIndex);
  }, [filteredDrivers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRouteId, searchTerm]);

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">
            Drivers
          </h1>
          <Link href="/drivers/create">
            <Button>Add Driver</Button>
          </Link>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading drivers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <Link
              href="/"
              className="hover:text-[var(--primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 rounded"
            >
              Dashboard
            </Link>
          </li>
          <li className="flex items-center">
            <svg
              className="w-4 h-4 mx-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-900 font-medium">Drivers</span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">
            Drivers
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your drivers and their route assignments
          </p>
        </div>
        <Link href="/drivers/create">
          <Button className="w-full sm:w-auto">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Driver
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <DriverSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search drivers by name or phone..."
        />
      </div>

      {/* Route Tabs */}
      <div className="mb-6">
        <RouteTabs
          routes={routes}
          selectedRouteId={selectedRouteId}
          onRouteSelect={setSelectedRouteId}
          driverCounts={driverCounts}
        />
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        {searchTerm || selectedRouteId ? (
          <>
            Showing {filteredDrivers.length} of {drivers.length} drivers
            (filtered)
          </>
        ) : (
          <>Total: {drivers.length} drivers</>
        )}
      </div>

      {/* Driver List */}
      <div className="mb-6">
        <DriverList
          drivers={paginatedDrivers}
          routes={routes}
          onRouteBadgeClick={setSelectedRouteId}
          showRouteBadges={selectedRouteId === null} // Show badges when "All" is selected
        />
      </div>

      {/* Pagination */}
      <DriverPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredDrivers.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
}
