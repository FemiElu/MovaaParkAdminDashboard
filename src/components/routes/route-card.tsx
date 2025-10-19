"use client";

import React from "react";
import Link from "next/link";
import { RouteConfig } from "@/types";
import { TrashIcon } from "@heroicons/react/24/outline";

interface RouteCardProps {
  route: RouteConfig;
  driverCount?: number;
  isDeletable?: boolean;
  onDelete?: (routeId: string) => void;
}

export function RouteCard({
  route,
  driverCount = 0,
  isDeletable = true,
  onDelete,
}: RouteCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      onDelete &&
      window.confirm(
        `Are you sure you want to delete the route to ${route.destination}?`
      )
    ) {
      onDelete(route.id);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] relative group">
      {/* Delete button */}
      {onDelete && isDeletable && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          title="Delete route"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
      {onDelete && !isDeletable && (
        <div
          className="absolute top-2 right-2 p-1 text-gray-300"
          title="Route has linked data and cannot be deleted"
        >
          <TrashIcon className="h-4 w-4" />
        </div>
      )}

      <Link
        href={`/routes/${route.id}`}
        className="block"
        tabIndex={0}
        aria-label={`View details for route to ${route.destination}`}
      >
        <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2">
          {/* Hide decorative icon on mobile to avoid truncation; show on sm+ */}
          <span className="hidden sm:inline-flex rounded-full bg-emerald-50 p-2">
            <svg
              className="w-6 h-6 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2h5m4-4V4m0 0L7 7m4-3l4 3"
              />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="text-base sm:text-lg font-medium text-gray-900 truncate">
                {route.destination}
              </div>
              <span
                className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                  route.isActive ? "bg-green-500" : "bg-gray-400"
                }`}
                title={route.isActive ? "Active" : "Inactive"}
                aria-label={route.isActive ? "Active" : "Inactive"}
              />
            </div>
            {route.destinationPark && (
              <div className="text-xs text-gray-600 truncate mt-0.5">
                {route.destinationPark}
              </div>
            )}
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-700">
          <div className="flex justify-between items-center">
            <span>
              {driverCount} Driver{driverCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
