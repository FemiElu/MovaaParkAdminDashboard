"use client";

import { cn } from "@/lib/utils";
import { RouteConfig } from "@/types";

interface RouteTabsProps {
  routes: RouteConfig[];
  selectedRouteId: string | null;
  onRouteSelect: (routeId: string | null) => void;
}

export function RouteTabs({
  routes,
  selectedRouteId,
  onRouteSelect,
}: RouteTabsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter by Route</h3>
        <div className="text-sm text-gray-500">
          {routes.length} route{routes.length !== 1 ? "s" : ""} available
        </div>
      </div>

      {/* Route Tabs - Behance-style horizontal scrollable */}
      <div className="relative">
        {/* Scrollable tabs container */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* All Routes Tab */}
          <button
            onClick={() => onRouteSelect(null)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0",
              "border border-gray-200 hover:border-gray-300",
              selectedRouteId === null
                ? "bg-green-600 text-white border-green-600 shadow-sm"
                : "bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            All Routes
          </button>

          {/* Individual Route Tabs */}
          {routes
            .filter((route) => route.isActive)
            .map((route) => (
              <button
                key={route.id}
                onClick={() => onRouteSelect(route.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0",
                  "border border-gray-200 hover:border-gray-300",
                  selectedRouteId === route.id
                    ? "bg-green-600 text-white border-green-600 shadow-sm"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-2">
                  <span>{route.destination}</span>
                  <span className="text-xs opacity-75">
                    ₦{route.basePrice.toLocaleString()}
                  </span>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Show inactive routes if any */}
      {routes.some((route) => !route.isActive) && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">Inactive Routes:</div>
          <div className="flex flex-wrap gap-2">
            {routes
              .filter((route) => !route.isActive)
              .map((route) => (
                <span
                  key={route.id}
                  className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-500"
                >
                  {route.destination}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
