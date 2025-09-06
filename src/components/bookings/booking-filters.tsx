"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface BookingFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  routeFilter: string;
  onRouteFilterChange: (route: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  dateFilter: string;
  onDateFilterChange: (date: string) => void;
  availableRoutes: string[];
}

export function BookingFilters({
  statusFilter,
  onStatusFilterChange,
  routeFilter,
  onRouteFilterChange,
  searchQuery,
  onSearchQueryChange,
  dateFilter,
  onDateFilterChange,
  availableRoutes,
}: BookingFiltersProps) {
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "reserved", label: "Reserved" },
    { value: "confirmed", label: "Confirmed" },
    { value: "expired", label: "Expired" },
    { value: "cancelled", label: "Cancelled" },
    { value: "completed", label: "Completed" },
  ];

  const dateOptions = [
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "all", label: "All Dates" },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <h3 className="text-sm font-medium text-gray-900">Filters</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label
            htmlFor="search"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Name, phone, or ID..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label
            htmlFor="status"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Route Filter */}
        <div>
          <label
            htmlFor="route"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Destination
          </label>
          <select
            id="route"
            value={routeFilter}
            onChange={(e) => onRouteFilterChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">All Destinations</option>
            {availableRoutes.map((route) => (
              <option key={route} value={route}>
                {route}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <label
            htmlFor="date"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Date
          </label>
          <select
            id="date"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            {dateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}



