"use client";

import React, { useState, useMemo } from "react";
import { Calendar, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EnhancedTripCard } from "./enhanced-trip-card";
import { Trip, tripsStore } from "@/lib/trips-store";
import { listRoutes } from "@/lib/routes-store";

interface TripsListProps {
  parkId: string;
  trips: Trip[];
  drivers: Array<{
    id: string;
    name: string;
    phone: string;
    rating: number;
    parkId: string;
  }>;
  onEditTrip?: (trip: Trip) => void;
  onCreateTrip?: () => void;
}

export function TripsList({
  parkId,
  trips,
  drivers,
  onEditTrip,
  onCreateTrip,
}: TripsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [routeFilter, setRouteFilter] = useState<string>("all");
  const [showCalendar, setShowCalendar] = useState(false);

  // Get routes for filtering
  const routes = useMemo(() => listRoutes(parkId), [parkId]);

  // Filter trips based on search and filters
  const filteredTrips = useMemo(() => {
    let filtered = trips;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((trip) => {
        const route = routes.find((r) => r.id === trip.routeId);
        const driver = drivers.find((d) => d.id === trip.driverId);

        return (
          route?.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
          driver?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.date.includes(searchTerm)
        );
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((trip) => trip.status === statusFilter);
    }

    // Route filter
    if (routeFilter !== "all") {
      filtered = filtered.filter((trip) => trip.routeId === routeFilter);
    }

    return filtered.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [trips, searchTerm, statusFilter, routeFilter, routes, drivers]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalTrips = trips.length;
    const draftTrips = trips.filter((t) => t.status === "draft").length;
    const publishedTrips = trips.filter((t) => t.status === "published").length;
    const liveTrips = trips.filter((t) => t.status === "live").length;

    return {
      total: totalTrips,
      draft: draftTrips,
      published: publishedTrips,
      live: liveTrips,
    };
  }, [trips]);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Trip Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your park&apos;s trip schedules
            </p>
          </div>
          <Button
            onClick={onCreateTrip}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Create Trip
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total Trips</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.draft}
            </div>
            <div className="text-sm text-blue-600">Draft</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.published}
            </div>
            <div className="text-sm text-green-600">Published</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.live}
            </div>
            <div className="text-sm text-orange-600">Live</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search trips by route, vehicle, driver, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Route Filter */}
          <div className="md:w-48">
            <Select value={routeFilter} onValueChange={setRouteFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Routes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Routes</SelectItem>
                {routes.map((route) => (
                  <SelectItem key={route.id} value={route.id}>
                    {route.destination}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calendar Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowCalendar(!showCalendar)}
            className="md:w-auto"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {showCalendar ? "List View" : "Calendar"}
          </Button>
        </div>

        {/* Active Filters */}
        {(searchTerm || statusFilter !== "all" || routeFilter !== "all") && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchTerm && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Search: &quot;{searchTerm}&quot;
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter("all")}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </Badge>
            )}
            {routeFilter !== "all" && (
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-800"
              >
                Route: {routes.find((r) => r.id === routeFilter)?.destination}
                <button
                  onClick={() => setRouteFilter("all")}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Trips Grid */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Trips ({filteredTrips.length})
            </h3>
            <div className="text-sm text-gray-600">
              {filteredTrips.length === trips.length
                ? "Showing all trips"
                : "Filtered results"}
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredTrips.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Filter className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No trips found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all" || routeFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "No trips have been created yet."}
              </p>
              {onCreateTrip && (
                <Button
                  onClick={onCreateTrip}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Create First Trip
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredTrips.map((trip) => {
                const driver = drivers.find((d) => d.id === trip.driverId);
                const bookings = tripsStore.getBookings(trip.id);
                const parcels = tripsStore.getParcels(trip.id);

                return (
                  <EnhancedTripCard
                    key={trip.id}
                    trip={trip}
                    driver={driver}
                    drivers={drivers}
                    bookingsCount={bookings.length}
                    parcelsCount={parcels.length}
                    onEdit={onEditTrip}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
