"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DriverFormSchema, type DriverFormData } from "@/lib/driver";
import { Button } from "@/components/ui/button";
import { RouteConfig } from "@/types";
import { routeApiService } from "@/lib/route-api-service";

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
    watch,
    setValue,
    trigger,
  } = useForm<DriverFormData>({
    resolver: zodResolver(DriverFormSchema),
    defaultValues: initialData,
  });

  // Fetch routes for the current park
  useEffect(() => {
    async function fetchRoutes() {
      try {
        const response = await routeApiService.getAllRoutes();
        if (response.success) {
          // Convert API Route format to RouteConfig minimal shape used by this form
          const convertedRoutes: RouteConfig[] = response.data.map((route) => ({
            id: route.id,
            parkId: parkId || "default-park",
            destination: route.to_city,
            destinationPark: route.to_state,
            from_state: route.from_state,
            isActive: true,
            createdAt: route.created_at || new Date().toISOString(),
            updatedAt: route.updated_at || new Date().toISOString(),
          }));
          setRoutes(convertedRoutes);
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

  // Sync qualifiedRoute to route_id field
  const qualifiedRouteValue = watch("qualifiedRoute");
  useEffect(() => {
    if (qualifiedRouteValue) {
      setValue("route_id", qualifiedRouteValue);
    }
  }, [qualifiedRouteValue, setValue]);

  const handleFormSubmit = async (data: DriverFormData) => {
    console.log("Form submitted with data:", data);
    console.log("allRequiredFilled:", allRequiredFilled);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleFormError = (errors: Record<string, unknown>) => {
    console.log("Form validation errors:", errors);
  };

  // Required fields for simple client-side completeness check
  // Explicitly watch each required field to avoid dynamic watch usage
  const wName = watch("name");
  const wPhone = watch("phone");
  const wLicense = watch("licenseNumber");
  const wDob = watch("dob");
  const wNin = watch("nin");
  const wQualified = watch("qualifiedRoute");
  const wLicenseFile = watch("driversLicenseFile");
  const allRequiredFilled = [
    wName,
    wPhone,
    wLicense,
    wDob,
    wNin,
    wQualified,
    wLicenseFile,
  ].every((val) => {
    if (val instanceof File) {
      return val.size > 0; // File is selected and not empty
    }
    return (val ?? "").toString().trim() !== "";
  });

  // Debug logging
  console.log("Watched values:", {
    wName,
    wPhone,
    wLicense,
    wDob,
    wNin,
    wQualified,
    wLicenseFile: wLicenseFile
      ? `${wLicenseFile.name} (${wLicenseFile.size} bytes)`
      : null,
    wLicenseFileType: typeof wLicenseFile,
    wLicenseFileIsFile: wLicenseFile instanceof File,
    allRequiredFilled,
  });

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit, handleFormError)}
      className="space-y-4"
    >
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
            placeholder="AKW06968AA2"
          />
          {errors.licenseNumber && (
            <p className="mt-1 text-sm text-red-600">
              {errors.licenseNumber.message}
            </p>
          )}
        </div>

        {/* Driver's License File Upload */}
        <div>
          <label
            htmlFor="driversLicenseFile"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Upload Driver&apos;s License *
          </label>
          <input
            type="file"
            id="driversLicenseFile"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setValue("driversLicenseFile", file);
                // Trigger validation for this field
                trigger("driversLicenseFile");
              }
            }}
          />
          <p className="mt-1 text-sm text-gray-500">
            Upload a scanned copy of the driver&apos;s license (PDF, DOC, DOCX,
            JPG, PNG)
          </p>
          {errors.driversLicenseFile && (
            <p className="mt-1 text-sm text-red-600">
              {errors.driversLicenseFile.message}
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

        {/* Date of Birth */}
        <div>
          <label
            htmlFor="dob"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date of Birth *
          </label>
          <input
            {...register("dob")}
            type="date"
            id="dob"
            max={new Date().toISOString().slice(0, 10)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
          {errors.dob && (
            <p className="mt-1 text-sm text-red-600">{errors.dob.message}</p>
          )}
        </div>
        {/* NIN (National Identity Number) */}
        <div>
          <label
            htmlFor="nin"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            NIN *
          </label>
          <input
            {...register("nin")}
            type="text"
            id="nin"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            placeholder="Enter National Identity Number"
          />
          {errors.nin && (
            <p className="mt-1 text-sm text-red-600">{errors.nin.message}</p>
          )}
        </div>
        {/* Qualified Route (Route dropdown) */}
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
                <option key={route.id} value={route.id}>
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
          {/* hidden field to pass route_id for backend */}
          <input type="hidden" {...register("route_id")} />
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
        <Button
          type="submit"
          disabled={isLoading || !allRequiredFilled}
          onClick={() =>
            console.log(
              "Button clicked! isLoading:",
              isLoading,
              "allRequiredFilled:",
              allRequiredFilled
            )
          }
        >
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
