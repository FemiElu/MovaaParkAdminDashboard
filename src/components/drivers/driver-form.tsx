"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DriverFormSchema, type DriverFormData } from "@/lib/driver";
import { Button } from "@/components/ui/button";
import { RouteConfig } from "@/types";

interface DriverFormProps {
  initialData?: Partial<DriverFormData>;
  onSubmit: (data: DriverFormData) => Promise<void>;
  isLoading?: boolean;
  parkId: string;
}

export default function DriverForm({
  initialData,
  onSubmit,
  isLoading,
  parkId,
}: DriverFormProps) {
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DriverFormData>({
    resolver: zodResolver(DriverFormSchema),
    defaultValues: initialData,
  });

  // Fetch routes for the current park
  useEffect(() => {
    async function fetchRoutes() {
      try {
        const response = await fetch(`/api/routes?parkId=${parkId}`);
        const result = await response.json();
        if (result.success) {
          setRoutes(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch routes:", error);
      } finally {
        setLoadingRoutes(false);
      }
    }

    fetchRoutes();
  }, [parkId]);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: DriverFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name *
          </label>
          <input
            {...register("name")}
            type="text"
            id="name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            placeholder="Enter driver's full name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone Number *
          </label>
          <input
            {...register("phone")}
            type="tel"
            id="phone"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            placeholder="+234 803 123 4567"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {/* License Number */}
        <div>
          <label
            htmlFor="licenseNumber"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            License Number *
          </label>
          <input
            {...register("licenseNumber")}
            type="text"
            id="licenseNumber"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            placeholder="ABC123-4"
          />
          {errors.licenseNumber && (
            <p className="mt-1 text-sm text-red-600">
              {errors.licenseNumber.message}
            </p>
          )}
        </div>

        {/* License Expiry */}
        <div>
          <label
            htmlFor="licenseExpiry"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            License Expiry Date *
          </label>
          <input
            {...register("licenseExpiry")}
            type="date"
            id="licenseExpiry"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
          {errors.licenseExpiry && (
            <p className="mt-1 text-sm text-red-600">
              {errors.licenseExpiry.message}
            </p>
          )}
        </div>

        {/* Qualified Route */}
        <div>
          <label
            htmlFor="qualifiedRoute"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Qualified Route *
          </label>
          {loadingRoutes ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
              Loading routes...
            </div>
          ) : (
            <select
              {...register("qualifiedRoute")}
              id="qualifiedRoute"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            >
              <option value="">Select a route</option>
              {routes.map((route) => (
                <option key={route.id} value={route.destination}>
                  {route.destination}
                </option>
              ))}
            </select>
          )}
          {errors.qualifiedRoute && (
            <p className="mt-1 text-sm text-red-600">
              {errors.qualifiedRoute.message}
            </p>
          )}
        </div>

        {/* Vehicle Plate Number */}
        <div>
          <label
            htmlFor="vehiclePlateNumber"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Vehicle Plate Number
          </label>
          <input
            {...register("vehiclePlateNumber")}
            type="text"
            id="vehiclePlateNumber"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            placeholder="ABC-123DE"
          />
          {errors.vehiclePlateNumber && (
            <p className="mt-1 text-sm text-red-600">
              {errors.vehiclePlateNumber.message}
            </p>
          )}
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Address
          </label>
          <input
            {...register("address")}
            type="text"
            id="address"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            placeholder="Driver's address"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">
              {errors.address.message}
            </p>
          )}
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          {...register("isActive")}
          type="checkbox"
          id="isActive"
          className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
          Driver is active
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : initialData
            ? "Update Driver"
            : "Create Driver"}
        </Button>
      </div>
    </form>
  );
}
