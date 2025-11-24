"use client";

import { useState, useEffect, useCallback } from "react";
import { RouteConfig, Driver } from "@/types";
import { RouteCard } from "./route-card";
import { RouteForm } from "./route-form";
import { routeApiService } from "@/lib/route-api-service";
import { driverApiService } from "@/lib/driver-api-service";
import { loadDriversFromStorage } from "@/lib/client-driver-storage";
import { normalizeString } from "@/lib/utils";
import { PlusIcon } from "@heroicons/react/24/outline";

interface RoutesManagerProps {
  parkId?: string;
}

export function RoutesManager({ parkId }: RoutesManagerProps) {
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteConfig | null>(null);
  const [query, setQuery] = useState("");

  const fetchRoutes = useCallback(async () => {
    try {
      console.log("fetchRoutes - starting...");
      const response = await routeApiService.getAllRoutes();
      console.log("fetchRoutes - response:", response);

      if (response.success) {
        console.log(
          "fetchRoutes - success, data length:",
          response.data.length
        );
        // Convert API Route format to RouteConfig format
        const convertedRoutes = response.data.map((route) => {
          console.log("Converting route:", route);
          // prefer to_city as destination but fallback to to_state or other
          const destination = route.to_city || route.to_state || route.to_city || "";
          return {
            id: route.id,
            parkId: parkId || "default-park",
            destination,
            destinationPark: route.to_state || undefined,
            from_state: route.from_state,
            isActive: true,
            createdAt: route.created_at || new Date().toISOString(),
            updatedAt: route.updated_at || new Date().toISOString(),
          } as RouteConfig;
        });
        console.log("fetchRoutes - converted routes:", convertedRoutes);
        setRoutes(convertedRoutes);
      } else {
        console.error("fetchRoutes - response not successful:", response);
      }
    } catch (error) {
      console.error("Failed to fetch routes:", error);
    } finally {
      setLoading(false);
    }
  }, [parkId]);

  const fetchDrivers = useCallback(async () => {
    try {
      console.log("fetchDrivers - Fetching from API...");

      // Fetch all drivers from the backend API
      const response = await driverApiService.getAllDrivers();

      if (!response.success || !response.data) {
        console.error("Failed to fetch drivers from API:", response.error);
        setDrivers([]);
        return;
      }

      console.log(`API returned ${response.data.length} drivers`);

      // Load route associations from localStorage
      const driverRoutesRaw = localStorage.getItem("driver_routes") || "{}";
      const driverRoutes: Record<string, { routeId: string; timestamp: number }> =
        JSON.parse(driverRoutesRaw);

      // Also load pending associations by phone number
      const driverRoutesByPhoneRaw = localStorage.getItem("driver_routes_by_phone") || "{}";
      const driverRoutesByPhone: Record<string, { routeId: string; timestamp: number }> =
        JSON.parse(driverRoutesByPhoneRaw);

      console.log("Driver route associations:", driverRoutes);
      console.log("Driver route associations by phone:", driverRoutesByPhone);

      // Convert API drivers to internal Driver format with route associations
      const convertedDrivers = response.data.map((apiDriver) => {
        const driverId = apiDriver.user.id;
        const driverPhone = apiDriver.user.phone_number;

        // Try to get route association by driver ID first, then by phone
        let routeAssociation = driverRoutes[driverId];
        if (!routeAssociation && driverPhone) {
          routeAssociation = driverRoutesByPhone[driverPhone];

          // If found by phone, migrate it to driver ID mapping
          if (routeAssociation) {
            driverRoutes[driverId] = routeAssociation;
            localStorage.setItem("driver_routes", JSON.stringify(driverRoutes));

            // Remove from phone mapping
            delete driverRoutesByPhone[driverPhone];
            localStorage.setItem("driver_routes_by_phone", JSON.stringify(driverRoutesByPhone));

            console.log(`Migrated route association for phone ${driverPhone} to driver ID ${driverId}`);
          }
        }

        const driver: Driver = {
          id: driverId,
          parkId: parkId || "default-park",
          name: `${apiDriver.user.first_name} ${apiDriver.user.last_name}`.trim(),
          phone: apiDriver.user.phone_number,
          licenseNumber: apiDriver.plate_number || "N/A",
          licenseExpiry: apiDriver.date_of_birth,
          qualifiedRoute: "", // Will be set below if route association exists
          routeIds: routeAssociation ? [routeAssociation.routeId] : [],
          isActive: apiDriver.user.is_active,
          rating: 5,
          vehiclePlateNumber: apiDriver.plate_number,
          address: apiDriver.address || apiDriver.user.address || undefined,
          photo: apiDriver.user.avatar,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return driver;
      });

      setDrivers(convertedDrivers);
      console.log(`Loaded and converted ${convertedDrivers.length} drivers from API`);
      console.log(
        "Converted drivers with route IDs:",
        convertedDrivers.map((d) => ({
          name: d.name,
          routeIds: d.routeIds,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
      setDrivers([]);
    }
  }, [parkId]);

  useEffect(() => {
    if (parkId) {
      fetchRoutes();
      fetchDrivers();
    }
  }, [parkId, fetchRoutes, fetchDrivers]);

  // Refresh drivers when the component mounts or when localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `drivers_${parkId}`) {
        fetchDrivers();
      }
    };

    // Listen for localStorage changes
    window.addEventListener("storage", handleStorageChange);

    // Also refresh on focus (in case data was updated in another tab)
    const handleFocus = () => {
      fetchDrivers();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [parkId, fetchDrivers]);

  const handleRouteAdded = (newRoute: RouteConfig) => {
    setRoutes((prev) => [...prev, newRoute]);
    setShowForm(false);
  };

  const handleRouteUpdated = (updatedRoute: RouteConfig) => {
    setRoutes((prev) =>
      prev.map((r) => (r.id === updatedRoute.id ? updatedRoute : r))
    );
    setEditingRoute(null);
  };

  const handleRouteDeleted = async (routeId: string) => {
    try {
      // Prevent deletion if linked (drivers/trips). We at least check drivers here.
      const linkedDriverCount = drivers.filter((d) => {
        return d.routeIds && d.routeIds.includes(routeId);
      }).length;

      if (linkedDriverCount > 0) {
        alert(
          "This route has linked drivers and cannot be deleted. Remove all links first."
        );
        return;
      }

      const resp = await routeApiService.deleteRoute(routeId);
      if (resp.success) {
        setRoutes((prev) => prev.filter((r) => r.id !== routeId));
      } else {
        console.error("Failed to delete route:", resp);
        alert(resp.error || "Failed to delete route. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting route:", error);
      alert("Failed to delete route. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="w-full sm:w-auto flex items-center justify-between gap-3">
          <h2 className="text-lg lg:text-xl font-medium text-gray-900">
            Active Routes ({routes.length})
          </h2>
        </div>
        {/* Search */}
        <div className="w-full sm:max-w-xs">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search routes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            aria-label="Search routes"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 transition-colors text-sm font-medium sm:w-auto"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Route</span>
        </button>
      </div>

      {/* Routes Grid */}
      {routes.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 6-3v13l-6 3-6-3z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-medium text-gray-900">
            No routes configured
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by adding your first destination route.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Add First Route
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-6">
          {routes
            .filter((r) => {
              if (!query.trim()) return true;
              const q = query.toLowerCase();
              return (
                r.destination.toLowerCase().includes(q) ||
                (r.destinationPark?.toLowerCase().includes(q) ?? false)
              );
            })
            .map((route) => {
              // Calculate driver count by matching route IDs
              // Check if route.id exists in driver's routeIds array
              const driverCount = drivers.filter((d) => {
                return d.routeIds && d.routeIds.includes(route.id);
              }).length;

              console.log(
                `Route ${route.destination} (ID: ${route.id}) has ${driverCount} drivers`
              );
              console.log(
                `Available drivers for route:`,
                drivers
                  .filter((d) => d.routeIds && d.routeIds.includes(route.id))
                  .map((d) => ({
                    name: d.name,
                    routeIds: d.routeIds,
                  }))
              );

              const isDeletable = driverCount === 0; // Extend later with trips check
              return (
                <RouteCard
                  key={route.id}
                  route={route}
                  driverCount={driverCount}
                  isDeletable={isDeletable}
                  onDelete={handleRouteDeleted}
                />
              );
            })}
        </div>
      )}

      {/* Route Form Modal */}
      {(showForm || editingRoute) && (
        <RouteForm
          route={editingRoute}
          parkId={parkId}
          onClose={() => {
            setShowForm(false);
            setEditingRoute(null);
          }}
          onSuccess={editingRoute ? handleRouteUpdated : handleRouteAdded}
        />
      )}
    </div>
  );
}
