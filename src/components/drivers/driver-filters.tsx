"use client";

import React, { useState } from "react";
import { DriverFilter } from "@/lib/driver-filters";
import { Button } from "@/components/ui/button";

interface DriverFiltersProps {
  filters: DriverFilter;
  onFiltersChange: (filters: DriverFilter) => void;
  availableRoutes: string[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function DriverFilters({
  filters,
  onFiltersChange,
  availableRoutes,
  isCollapsed,
  onToggleCollapse,
}: DriverFiltersProps) {
  const [localFilters, setLocalFilters] = useState<DriverFilter>(filters);

  const handleFilterChange = (key: keyof DriverFilter, value: unknown) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const clearedFilters: DriverFilter = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="bg-white border rounded-lg">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="bg-[var(--primary)] text-white text-xs px-2 py-1 rounded-full">
              {Object.keys(filters).length}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleCollapse}
          className="text-gray-600"
        >
          {isCollapsed ? "Show Filters" : "Hide Filters"}
        </Button>
      </div>

      {/* Filter Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Route Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route
              </label>
              <select
                value={localFilters.destination || ""}
                onChange={(e) =>
                  handleFilterChange("destination", e.target.value || undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">All Routes</option>
                {availableRoutes.map((route) => (
                  <option key={route} value={route}>
                    {route}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={localFilters.status || ""}
                onChange={(e) =>
                  handleFilterChange("status", e.target.value || undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* License Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Status
              </label>
              <select
                value={localFilters.license || ""}
                onChange={(e) =>
                  handleFilterChange("license", e.target.value || undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">All License Status</option>
                <option value="valid">Valid</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Rating
              </label>
              <select
                value={localFilters.minRating || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "minRating",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">Any Rating</option>
                <option value="5">5 Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>
            </div>

            {/* Availability Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Availability
              </label>
              <select
                value={localFilters.availability || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "availability",
                    e.target.value || undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">All Availability</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            {/* Date Filter for Availability */}
            {localFilters.availability && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={
                    localFilters.date
                      ? localFilters.date.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      "date",
                      e.target.value ? new Date(e.target.value) : undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Filter Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button onClick={applyFilters} size="sm">
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={clearFilters}
              size="sm"
              disabled={!hasActiveFilters}
            >
              Clear All
            </Button>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="pt-2">
              <div className="text-sm text-gray-600 mb-2">Active Filters:</div>
              <div className="flex flex-wrap gap-2">
                {filters.destination && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[var(--primary)] text-white">
                    Route: {filters.destination}
                    <button
                      onClick={() => {
                        const newFilters = { ...filters };
                        delete newFilters.destination;
                        onFiltersChange(newFilters);
                      }}
                      className="ml-1 hover:bg-emerald-800 rounded-full"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.status && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[var(--primary)] text-white">
                    Status: {filters.status}
                    <button
                      onClick={() => {
                        const newFilters = { ...filters };
                        delete newFilters.status;
                        onFiltersChange(newFilters);
                      }}
                      className="ml-1 hover:bg-emerald-800 rounded-full"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.license && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[var(--primary)] text-white">
                    License: {filters.license}
                    <button
                      onClick={() => {
                        const newFilters = { ...filters };
                        delete newFilters.license;
                        onFiltersChange(newFilters);
                      }}
                      className="ml-1 hover:bg-emerald-800 rounded-full"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.minRating && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[var(--primary)] text-white">
                    Rating: {filters.minRating}+
                    <button
                      onClick={() => {
                        const newFilters = { ...filters };
                        delete newFilters.minRating;
                        onFiltersChange(newFilters);
                      }}
                      className="ml-1 hover:bg-emerald-800 rounded-full"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.availability && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[var(--primary)] text-white">
                    Availability: {filters.availability}
                    <button
                      onClick={() => {
                        const newFilters = { ...filters };
                        delete newFilters.availability;
                        delete newFilters.date;
                        onFiltersChange(newFilters);
                      }}
                      className="ml-1 hover:bg-emerald-800 rounded-full"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
