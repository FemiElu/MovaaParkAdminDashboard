"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DriverOnboardFormSchema,
  type DriverOnboardFormData,
} from "@/lib/driver-onboard-schema";
import { driverApiService } from "@/lib/driver-api-service";

interface DriverOnboardFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DriverOnboardForm({
  onSuccess,
  onCancel,
}: DriverOnboardFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DriverOnboardFormData>({
    resolver: zodResolver(DriverOnboardFormSchema),
  });

  const onSubmit = async (data: DriverOnboardFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await driverApiService.onboardDriver(data);

      if (response.success) {
        setSuccess("Driver onboarded successfully!");
        reset();
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        setError(response.error || "Failed to onboard driver");
      }
    } catch (error) {
      setError("An error occurred while onboarding the driver");
      console.error("Driver onboard error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Onboard New Driver</h2>
        <p className="text-gray-600">
          Fill in the driver&apos;s information to onboard them to the system.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              First Name *
            </label>
            <input
              {...register("first_name")}
              type="text"
              id="first_name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter first name"
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.first_name.message}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Last Name *
            </label>
            <input
              {...register("last_name")}
              type="text"
              id="last_name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter last name"
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.last_name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address *
            </label>
            <input
              {...register("email")}
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="driver@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="phone_number"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number *
            </label>
            <input
              {...register("phone_number")}
              type="tel"
              id="phone_number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="+234 803 123 4567"
            />
            {errors.phone_number && (
              <p className="mt-1 text-sm text-red-600">
                {errors.phone_number.message}
              </p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label
              htmlFor="date_of_birth"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date of Birth *
            </label>
            <input
              {...register("date_of_birth")}
              type="date"
              id="date_of_birth"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {errors.date_of_birth && (
              <p className="mt-1 text-sm text-red-600">
                {errors.date_of_birth.message}
              </p>
            )}
          </div>

          {/* NIN */}
          <div>
            <label
              htmlFor="nin"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              National Identification Number (NIN) *
            </label>
            <input
              {...register("nin")}
              type="text"
              id="nin"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="12345678901"
              maxLength={11}
            />
            {errors.nin && (
              <p className="mt-1 text-sm text-red-600">{errors.nin.message}</p>
            )}
          </div>

          {/* Plate Number */}
          <div>
            <label
              htmlFor="plate_number"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Vehicle Plate Number *
            </label>
            <input
              {...register("plate_number")}
              type="text"
              id="plate_number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="ABC-123DE"
              style={{ textTransform: "uppercase" }}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register("plate_number").onChange(e);
              }}
            />
            {errors.plate_number && (
              <p className="mt-1 text-sm text-red-600">
                {errors.plate_number.message}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Address *
            </label>
            <textarea
              {...register("address")}
              id="address"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter complete address"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">
                {errors.address.message}
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
            {isLoading ? "Onboarding..." : "Onboard Driver"}
          </button>
        </div>
      </form>
    </div>
  );
}
