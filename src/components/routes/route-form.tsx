"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RouteConfig, RouteFormData } from "@/types";
import { routeApiService } from "@/lib/route-api-service";
import { XMarkIcon } from "@heroicons/react/24/outline";

const routeSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  destinationPark: z.string().trim().optional(),
  from_state: z.string().min(1, "From state is required"),
  isActive: z.boolean(),
});

interface RouteFormProps {
  route?: RouteConfig | null;
  parkId?: string;
  onClose: () => void;
  onSuccess: (route: RouteConfig) => void;
}

export function RouteForm({
  route,
  parkId,
  onClose,
  onSuccess,
}: RouteFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      destination: route?.destination || "",
      destinationPark: route?.destinationPark || "",
      from_state: "Lagos", // Default from state
      isActive: route?.isActive ?? true,
    },
  });

  const onSubmit = async (data: RouteFormData) => {
    setLoading(true);
    setError("");

    try {
      if (route) {
        // Update existing route - using mock API for now since PUT endpoint not provided
        const response = await fetch(`/api/routes/${route.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, parkId }),
        });
        const result = await response.json();
        if (response.ok) {
          onSuccess(result.data);
        } else {
          setError(result.error || "Failed to update route");
        }
      } else {
        // Create new route using real API
        const routeData = {
          from_state: data.from_state,
          to_state: data.destinationPark || "Unknown",
          to_city: data.destination,
          bus_stop: `${data.destination} Park`, // Default bus stop
        };

        const response = await routeApiService.createRoute(routeData);
        if (response.success && response.data) {
          // Convert API Route format to RouteConfig format
          const convertedRoute = {
            id: response.data.id,
            parkId: parkId || "default-park",
            destination: response.data.to_city,
            destinationPark: response.data.to_state,
            from_state: response.data.from_state,
            isActive: true,
            createdAt: response.data.created_at || new Date().toISOString(),
            updatedAt: response.data.updated_at || new Date().toISOString(),
          };
          onSuccess(convertedRoute);
        } else {
          setError(response.error || "Failed to create route");
        }
      }
    } catch (error) {
      console.error("Error saving route:", error);
      setError("Failed to save route");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {route ? "Edit Route" : "Add New Route"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="from_state"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              From State *
            </label>
            <select
              {...register("from_state")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja (FCT)</option>
              <option value="Kano">Kano</option>
              <option value="Rivers">Rivers</option>
              <option value="Oyo">Oyo</option>
              <option value="Osun">Osun</option>
              <option value="Ondo">Ondo</option>
              <option value="Ekiti">Ekiti</option>
              <option value="Kwara">Kwara</option>
              <option value="Ogun">Ogun</option>
            </select>
            {errors.from_state && (
              <p className="mt-1 text-sm text-red-600">
                {errors.from_state.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="destination"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Destination *
            </label>
            <input
              {...register("destination")}
              type="text"
              placeholder="e.g., Ibadan, Abuja"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {errors.destination && (
              <p className="mt-1 text-sm text-red-600">
                {errors.destination.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="destinationPark"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Destination Park
            </label>
            <input
              {...register("destinationPark")}
              type="text"
              placeholder="e.g., Iwo Road Park"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {errors.destinationPark && (
              <p className="mt-1 text-sm text-red-600">
                {errors.destinationPark.message as string}
              </p>
            )}
          </div>

          <div className="flex items-center">
            <input
              {...register("isActive")}
              type="checkbox"
              id="isActive"
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isActive"
              className="ml-2 block text-sm text-gray-900"
            >
              Route is active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : route ? "Update Route" : "Add Route"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
