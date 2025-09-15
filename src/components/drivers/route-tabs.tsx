"use client";

import React from "react";
import { RouteConfig } from "@/types";

interface RouteTabsProps {
  routes: RouteConfig[];
  selectedRouteId: string | null; // null means "All" selected
  onRouteSelect: (routeId: string | null) => void;
  driverCounts: Record<string, number>; // routeId -> count
  className?: string;
}

export function RouteTabs({
  routes,
  selectedRouteId,
  onRouteSelect,
  driverCounts,
  className = "",
}: RouteTabsProps) {
  const allCount = Object.values(driverCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className={`relative ${className}`}>
      {/* Horizontal scroll container */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2 pb-2 min-w-max">
          {/* All tab */}
          <button
            onClick={() => onRouteSelect(null)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2
              ${
                selectedRouteId === null
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }
            `}
            aria-label={`Show all drivers (${allCount} total)`}
            aria-pressed={selectedRouteId === null}
          >
            <span>All</span>
            <span
              className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${
                  selectedRouteId === null
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600"
                }
              `}
            >
              {allCount}
            </span>
          </button>

          {/* Route tabs */}
          {routes.map((route) => {
            const count = driverCounts[route.id] || 0;
            const isSelected = selectedRouteId === route.id;

            return (
              <button
                key={route.id}
                onClick={() => onRouteSelect(route.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2
                  ${
                    isSelected
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }
                `}
                aria-label={`Filter by ${route.destination} route (${count} drivers)`}
                aria-pressed={isSelected}
              >
                <span>{route.destination}</span>
                <span
                  className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-600"
                    }
                  `}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scroll indicators */}
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  );
}
