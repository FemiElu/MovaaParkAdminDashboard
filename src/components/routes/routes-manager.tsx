"use client";

import { useState, useEffect, useCallback } from "react";
import { RouteConfig, Driver } from "@/types";
import { RouteCard } from "./route-card";
import { RouteForm } from "./route-form";
import { routeApiService } from "@/lib/route-api-service";
import { loadDriversFromStorage } from "@/lib/client-driver-storage";
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
          return {
            id: route.id,
            parkId: parkId || "default-park",
            destination: route.to_city,
            destinationPark: route.to_state,
            from_state: route.from_state,
            isActive: true,
            createdAt: route.created_at || new Date().toISOString(),
            updatedAt: route.updated_at || new Date().toISOString(),
          };
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
      // Use local storage drivers that have proper route associations
      const localDrivers = loadDriversFromStorage(parkId || "default-park");
      setDrivers(localDrivers);
      console.log(`Loaded ${localDrivers.length} drivers from local storage`);
      console.log(
        "Local drivers:",
        localDrivers.map((d) => ({
          name: d.name,
          qualifiedRoute: d.qualifiedRoute,
        }))
      );
    } catch (error) {
      console.error("Failed to load drivers from storage:", error);
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
      const route = routes.find((r) => r.id === routeId);
      const linkedDriverCount = drivers.filter((d) => {
        if (!route) return false;
        return (
          d.qualifiedRoute === route.destination ||
          d.qualifiedRoute
            ?.toLowerCase()
            .includes(route.destination.toLowerCase()) ||
          d.qualifiedRoute
            ?.toLowerCase()
            .includes(route.destinationPark?.toLowerCase() || "")
        );
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
              // Calculate driver count by matching qualified routes with route destination
              const driverCount = drivers.filter((d) => {
                // Check if driver's qualified route matches the route destination
                // The qualifiedRoute should contain the route destination name
                return (
                  d.qualifiedRoute === route.destination ||
                  d.qualifiedRoute
                    ?.toLowerCase()
                    .includes(route.destination.toLowerCase()) ||
                  d.qualifiedRoute
                    ?.toLowerCase()
                    .includes(route.destinationPark?.toLowerCase() || "")
                );
              }).length;

              console.log(
                `Route ${route.destination} (${route.destinationPark}) has ${driverCount} drivers`
              );
              console.log(
                `Available drivers:`,
                drivers.map((d) => ({
                  name: d.name,
                  qualifiedRoute: d.qualifiedRoute,
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
