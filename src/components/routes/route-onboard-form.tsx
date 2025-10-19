"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RouteOnboardFormSchema,
  type RouteOnboardFormData,
} from "@/lib/route-onboard-schema";
import { routeApiService } from "@/lib/route-api-service";

interface RouteOnboardFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RouteOnboardForm({
  onSuccess,
  onCancel,
}: RouteOnboardFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RouteOnboardFormData>({
    resolver: zodResolver(RouteOnboardFormSchema),
  });

  const onSubmit = async (data: RouteOnboardFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await routeApiService.createRoute(data);

      if (response.success) {
        setSuccess("Route created successfully!");
        reset();
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        setError(response.error || "Failed to create route");
      }
    } catch (error) {
      setError("An error occurred while creating the route");
      console.error("Route creation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Route</h2>
        <p className="text-gray-600">
          Fill in the route information to create a new route.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* To State */}
          <div>
            <label
              htmlFor="to_state"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              To State *
            </label>
            <input
              {...register("to_state")}
              type="text"
              id="to_state"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., Oyo"
            />
            {errors.to_state && (
              <p className="mt-1 text-sm text-red-600">
                {errors.to_state.message}
              </p>
            )}
          </div>

          {/* To City */}
          <div>
            <label
              htmlFor="to_city"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              To City *
            </label>
            <input
              {...register("to_city")}
              type="text"
              id="to_city"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., Ibadan"
            />
            {errors.to_city && (
              <p className="mt-1 text-sm text-red-600">
                {errors.to_city.message}
              </p>
            )}
          </div>

          {/* Bus Stop */}
          <div>
            <label
              htmlFor="bus_stop"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Bus Stop *
            </label>
            <input
              {...register("bus_stop")}
              type="text"
              id="bus_stop"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., Jibowu Park"
            />
            {errors.bus_stop && (
              <p className="mt-1 text-sm text-red-600">
                {errors.bus_stop.message}
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
            {isLoading ? "Creating..." : "Create Route"}
          </button>
        </div>
      </form>
    </div>
  );
}
