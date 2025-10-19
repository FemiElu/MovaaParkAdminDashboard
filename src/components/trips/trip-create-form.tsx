"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TripCreateFormSchema,
  type TripCreateFormData,
} from "@/lib/trip-create-schema";
import { tripApiService } from "@/lib/trip-api-service";
import { routeApiService, Route } from "@/lib/route-api-service";
import { driverApiService, Driver } from "@/lib/driver-api-service";

interface TripCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TripCreateForm({
  onSuccess,
  onCancel,
}: TripCreateFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<TripCreateFormData>({
    resolver: zodResolver(TripCreateFormSchema),
    defaultValues: {
      is_recurrent: false,
      price: "0",
      total_seats: 1,
    },
  });

  // Watch for route changes to filter drivers
  const selectedRoute = watch("to_route");
  const selectedDriverId = watch("driver_id");

  // Fetch available routes
  useEffect(() => {
    async function fetchRoutes() {
      try {
        const response = await routeApiService.getAllRoutes();
        if (response.success) {
          setRoutes(response.data);
        } else {
          setError("Failed to load routes");
        }
      } catch (error) {
        setError("Failed to load routes");
        console.error("Error fetching routes:", error);
      } finally {
        setLoadingRoutes(false);
      }
    }

    fetchRoutes();
  }, []);

  // Fetch drivers
  useEffect(() => {
    async function fetchDrivers() {
      setLoadingDrivers(true);
      try {
        const response = await driverApiService.getAllDrivers();
        console.log("TripCreateForm - Driver API Response:", response);

        if (response.success) {
          console.log("TripCreateForm - Drivers loaded:", response.data);
          setDrivers(response.data);
        } else {
          console.error("Failed to load drivers:", response.error);
        }
      } catch (error) {
        console.error("Error fetching drivers:", error);
      } finally {
        setLoadingDrivers(false);
      }
    }

    fetchDrivers();
  }, []);

  // Filter drivers when route changes
  useEffect(() => {
    if (selectedRoute && drivers.length > 0) {
      // For now, we'll show all drivers since we don't have route-specific filtering
      // In a real implementation, you'd filter by the driver's qualified routes
      setFilteredDrivers(drivers);
    } else {
      setFilteredDrivers([]);
    }
  }, [selectedRoute, drivers]);

  // Auto-fill driver phone when driver is selected
  useEffect(() => {
    if (selectedDriverId && filteredDrivers.length > 0) {
      const selectedDriver = filteredDrivers.find(
        (driver) => driver.user.id === selectedDriverId
      );
      if (selectedDriver) {
        setValue("driver_phone", selectedDriver.user.phone_number);
      }
    } else {
      setValue("driver_phone", "");
    }
  }, [selectedDriverId, filteredDrivers, setValue]);

  const onSubmit = async (data: TripCreateFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await tripApiService.createTrip(data);

      if (response.success) {
        setSuccess("Trip created successfully!");
        reset();
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        setError(response.error || "Failed to create trip");
      }
    } catch (error) {
      setError("An error occurred while creating the trip");
      console.error("Trip creation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingRoutes || loadingDrivers) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            {loadingRoutes ? "Loading routes..." : "Loading drivers..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Trip</h2>
        <p className="text-gray-600">
          Fill in the trip information to create a new trip.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Route Selection */}
          <div className="md:col-span-2">
            <label
              htmlFor="to_route"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Route *
            </label>
            <select
              {...register("to_route")}
              id="to_route"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select a route</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.from_state} → {route.to_city} ({route.bus_stop})
                </option>
              ))}
            </select>
            {errors.to_route && (
              <p className="mt-1 text-sm text-red-600">
                {errors.to_route.message}
              </p>
            )}
          </div>

          {/* From State */}
          <div>
            <label
              htmlFor="from_state"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              From State *
            </label>
            <input
              {...register("from_state")}
              type="text"
              id="from_state"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., Lagos"
            />
            {errors.from_state && (
              <p className="mt-1 text-sm text-red-600">
                {errors.from_state.message}
              </p>
            )}
          </div>

          {/* Total Seats */}
          <div>
            <label
              htmlFor="total_seats"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Total Seats *
            </label>
            <input
              {...register("total_seats", { valueAsNumber: true })}
              type="number"
              id="total_seats"
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="40"
            />
            {errors.total_seats && (
              <p className="mt-1 text-sm text-red-600">
                {errors.total_seats.message}
              </p>
            )}
          </div>

          {/* Departure Date */}
          <div>
            <label
              htmlFor="departure_date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Departure Date *
            </label>
            <input
              {...register("departure_date")}
              type="date"
              id="departure_date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {errors.departure_date && (
              <p className="mt-1 text-sm text-red-600">
                {errors.departure_date.message}
              </p>
            )}
          </div>

          {/* Departure Time */}
          <div>
            <label
              htmlFor="departure_time"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Departure Time *
            </label>
            <input
              {...register("departure_time")}
              type="time"
              id="departure_time"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {errors.departure_time && (
              <p className="mt-1 text-sm text-red-600">
                {errors.departure_time.message}
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Price (₦) *
            </label>
            <input
              {...register("price")}
              type="text"
              id="price"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="9000"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">
                {errors.price.message}
              </p>
            )}
          </div>

          {/* Driver Selection */}
          <div>
            <label
              htmlFor="driver_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Driver (optional)
            </label>
            <select
              {...register("driver_id")}
              id="driver_id"
              disabled={!selectedRoute || loadingDrivers}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a driver</option>
              {filteredDrivers.map((driver) => (
                <option key={driver.user.id} value={driver.user.id}>
                  {driver.user.first_name} {driver.user.last_name} -{" "}
                  {driver.user.phone_number}
                </option>
              ))}
            </select>
            {loadingDrivers && (
              <p className="mt-1 text-sm text-gray-500">Loading drivers...</p>
            )}
            {errors.driver_id && (
              <p className="mt-1 text-sm text-red-600">
                {errors.driver_id.message}
              </p>
            )}
          </div>

          {/* Driver Phone */}
          <div>
            <label
              htmlFor="driver_phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Driver Phone (optional)
            </label>
            <input
              {...register("driver_phone")}
              type="tel"
              id="driver_phone"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Driver phone number"
            />
            {errors.driver_phone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.driver_phone.message}
              </p>
            )}
          </div>

          {/* Is Recurrent */}
          <div className="md:col-span-2">
            <div className="flex items-center">
              <input
                {...register("is_recurrent")}
                type="checkbox"
                id="is_recurrent"
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label
                htmlFor="is_recurrent"
                className="ml-2 block text-sm text-gray-900"
              >
                This is a recurrent trip
              </label>
            </div>
            {errors.is_recurrent && (
              <p className="mt-1 text-sm text-red-600">
                {errors.is_recurrent.message}
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create Trip"}
          </button>
        </div>
      </form>
    </div>
  );
}
