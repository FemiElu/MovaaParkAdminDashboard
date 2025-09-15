"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DriverList from "@/components/drivers/driver-list";
import { RouteTabs } from "@/components/drivers/route-tabs";
import { DriverSearch } from "@/components/drivers/driver-search";
import { DriverPagination } from "@/components/drivers/driver-pagination";
import { Driver, RouteConfig } from "@/types";

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

  // Fetch drivers and routes
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch drivers
        const driversResponse = await fetch(`/api/drivers?parkId=${parkId}`);
        const driversResult = await driversResponse.json();
        if (driversResult.success && driversResult.data) {
          // Handle paginated response structure
          if (Array.isArray(driversResult.data.data)) {
            setDrivers(driversResult.data.data);
          }
          // Fallback: if data is directly an array (non-paginated response)
          else if (Array.isArray(driversResult.data)) {
            setDrivers(driversResult.data);
          } else {
            console.error("Invalid drivers response structure:", driversResult);
            setDrivers([]);
          }
        } else {
          console.error("Invalid drivers response:", driversResult);
          setDrivers([]);
        }

        // Fetch routes for tabs
        const routesResponse = await fetch(`/api/routes?parkId=${parkId}`);
        const routesResult = await routesResponse.json();
        if (routesResult.success && Array.isArray(routesResult.data)) {
          setRoutes(routesResult.data);
        } else {
          console.error("Invalid routes response:", routesResult);
          setRoutes([]);
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
    routes.forEach((route) => {
      counts[route.id] = drivers.filter(
        (d) => d.qualifiedRoute === route.destination
      ).length;
    });
    return counts;
  }, [drivers, routes]);

  // Filter and search drivers
  const filteredDrivers = useMemo(() => {
    let filtered = drivers;

    // Filter by selected route
    if (selectedRouteId) {
      const selectedRoute = routes.find((r) => r.id === selectedRouteId);
      if (selectedRoute) {
        filtered = filtered.filter(
          (driver) => driver.qualifiedRoute === selectedRoute.destination
        );
      }
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (driver) =>
          driver.name.toLowerCase().includes(searchLower) ||
          driver.phone.includes(searchTerm)
      );
    }

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
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading drivers...</p>
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
