"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RouteConfig, RouteFormData } from "@/types";
import { XMarkIcon } from "@heroicons/react/24/outline";

const routeSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
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
      isActive: route?.isActive ?? true,
    },
  });

  const onSubmit = async (data: RouteFormData) => {
    setLoading(true);
    setError("");

    try {
      const url = route ? `/api/routes/${route.id}` : "/api/routes";
      const method = route ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, parkId }),
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess(result.data);
      } else {
        setError(result.error || "Failed to save route");
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
              htmlFor="destination"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Destination
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
