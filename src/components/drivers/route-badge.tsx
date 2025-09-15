"use client";

import React from "react";
import { RouteConfig } from "@/types";

interface RouteBadgeProps {
  route: RouteConfig;
  onClick: (e?: React.MouseEvent) => void;
  className?: string;
}

// Generate consistent colors for routes
function getRouteColor(routeId: string): string {
  const colors = [
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-green-100 text-green-800 border-green-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-orange-100 text-orange-800 border-orange-200",
    "bg-pink-100 text-pink-800 border-pink-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
    "bg-teal-100 text-teal-800 border-teal-200",
    "bg-cyan-100 text-cyan-800 border-cyan-200",
  ];

  // Simple hash to get consistent color for same route
  let hash = 0;
  for (let i = 0; i < routeId.length; i++) {
    hash = ((hash << 5) - hash + routeId.charCodeAt(i)) & 0xffffffff;
  }
  return colors[Math.abs(hash) % colors.length];
}

export function RouteBadge({
  route,
  onClick,
  className = "",
}: RouteBadgeProps) {
  const colorClasses = getRouteColor(route.id);

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        border transition-all duration-100 hover:scale-105 focus:outline-none focus:ring-2 
        focus:ring-[var(--primary)] focus:ring-offset-1 cursor-pointer
        ${colorClasses}
        ${className}
      `}
      aria-label={`Filter by ${route.destination} route`}
      title={`Click to filter by ${route.destination} route`}
    >
      {/* Color dot */}
      <div className="w-2 h-2 rounded-full bg-current opacity-70" />

      {/* Route text */}
      <span className="truncate max-w-[80px]" title={route.destination}>
        {route.destination}
      </span>
    </button>
  );
}
