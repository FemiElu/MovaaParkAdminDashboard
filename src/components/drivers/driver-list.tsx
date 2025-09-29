import React from "react";
import { Driver, RouteConfig } from "@/types";
import Link from "next/link";
import { RouteBadge } from "./route-badge";

type Props = {
  drivers: Driver[];
  routes: RouteConfig[];
  onRouteBadgeClick: (routeId: string) => void;
  showRouteBadges?: boolean; // Show badges when "All" is selected
};

function expiryChip(expiry?: string) {
  if (!expiry)
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-700">
        Unknown
      </span>
    );
  const msLeft = new Date(expiry).getTime() - Date.now();
  if (msLeft < 0)
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-red-100 text-red-700">
        Expired
      </span>
    );
  const days = Math.ceil(msLeft / 86400000);
  if (days <= 7)
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-amber-100 text-amber-800">
        Expiring soon
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700">
      Valid
    </span>
  );
}

export default function DriverList({
  drivers,
  routes = [],
  onRouteBadgeClick,
  showRouteBadges = false,
}: Props) {
  // Helper to find route by destination name
  const findRouteByDestination = (destination: string) => {
    return routes.find((r) => r.destination === destination);
  };

  return (
    <div className="space-y-3">
      {drivers.map((d) => {
        const route = findRouteByDestination(d.qualifiedRoute);

        return (
          <Link
            key={d.id}
            href={`/drivers/${d.id}`}
            className="block border rounded-lg p-4 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Driver Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {d.name}
                    </h3>
                    {showRouteBadges && route && (
                      <RouteBadge
                        route={route}
                        onClick={(e) => {
                          e?.preventDefault();
                          e?.stopPropagation();
                          onRouteBadgeClick(route.id);
                        }}
                      />
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{d.phone}</div>
                  <div className="flex items-center gap-2">
                    {!showRouteBadges && (
                      <span className="text-sm text-gray-500">
                        {d.qualifiedRoute}
                      </span>
                    )}
                    {expiryChip(d.licenseExpiry)}
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`w-3 h-3 rounded-full ${
                    d.isActive ? "bg-green-400" : "bg-gray-300"
                  }`}
                  title={d.isActive ? "Active" : "Inactive"}
                />
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>
        );
      })}

      {drivers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2h5m4-4V4m0 0L7 7m4-3l4 3"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No drivers found
          </h3>
          <p className="text-gray-500">
            Try adjusting your filters or search terms.
          </p>
        </div>
      )}
    </div>
  );
}
