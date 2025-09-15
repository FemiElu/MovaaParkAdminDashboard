"use client";

import React from "react";
import Link from "next/link";
import { RouteConfig } from "@/types";

interface RouteCardProps {
  route: RouteConfig;
  driverCount?: number;
}

export function RouteCard({ route, driverCount = 0 }: RouteCardProps) {
  return (
    <Link
      href={`/routes/${route.id}`}
      className="block bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
      tabIndex={0}
      aria-label={`View details for route to ${route.destination}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="inline-block rounded-full bg-emerald-50 p-2">
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
        <div>
          <div className="text-lg font-medium text-gray-900">
            {route.destination}
          </div>
          <div className="text-xs font-semibold text-gray-500 mt-0.5">
            {route.isActive ? "Active" : "Inactive"}
          </div>
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-700">
        {driverCount} Driver{driverCount === 1 ? "" : "s"}
      </div>
    </Link>
  );
}
