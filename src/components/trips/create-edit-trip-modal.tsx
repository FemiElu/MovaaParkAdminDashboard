"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trip,
  TripFormData,
  Vehicle,
  RecurrencePattern,
  RouteConfig,
} from "@/types";

interface CreateEditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    tripData: TripFormData
  ) => Promise<{ success: boolean; error?: string }>;
  parkId: string;
  vehicles: Vehicle[];
  drivers: Array<{
    id: string;
    name: string;
    phone: string;
    rating: number;
    parkId: string;
    routeIds?: string[];
  }>;
  trip?: Trip; // For editing
  mode?: "create" | "edit";
}

export function CreateEditTripModal({
  isOpen,
  onClose,
  onSave,
  parkId,
  vehicles,
  drivers,
  trip,
  mode = "create",
}: CreateEditTripModalProps) {
  const [formData, setFormData] = useState<TripFormData>({
    routeId: "",
    date: "",
    unitTime: "06:00",
    vehicleId: "",
    seatCount: 0,
    price: 0,
    driverId: undefined,
    driverPhone: "",
    maxParcelsPerVehicle: 0,
    isRecurring: false,
    status: "draft",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecurrencePreview, setShowRecurrencePreview] = useState(false);
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [apiDrivers, setApiDrivers] = useState(drivers);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  // Fetch routes for the current park
  useEffect(() => {
    async function fetchRoutes() {
      try {
        setLoadingRoutes(true);
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

    if (isOpen) {
      fetchRoutes();
    }
  }, [parkId, isOpen]);

  // Fetch drivers from API to get the latest data
  useEffect(() => {
    async function fetchDrivers() {
      try {
        setLoadingDrivers(true);
        const response = await fetch(`/api/drivers?parkId=${parkId}`);
        if (response.ok) {
          const result = await response.json();
          setApiDrivers(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch drivers:", error);
      } finally {
        setLoadingDrivers(false);
      }
    }

    if (isOpen) {
      fetchDrivers();
    }
  }, [parkId, isOpen]);

  // Get drivers filtered by selected route
  const availableDrivers = useMemo(() => {
    if (!formData.routeId) {
      return apiDrivers; // Show all drivers if no route selected
    }
    return apiDrivers.filter(
      (driver) => driver.routeIds && driver.routeIds.includes(formData.routeId)
    );
  }, [apiDrivers, formData.routeId]);

  // Initialize form data when modal opens or trip changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && trip) {
        setFormData({
          routeId: trip.routeId,
          date: trip.date,
          unitTime: trip.unitTime,
          vehicleId: trip.vehicleId,
          seatCount: trip.seatCount,
          price: trip.price,
          driverId: trip.driverId || undefined,
          driverPhone: trip.driverPhone || "",
          maxParcelsPerVehicle: trip.maxParcelsPerVehicle,
          isRecurring: trip.isRecurring,
          recurrencePattern: trip.recurrencePattern,
          status: trip.status as "draft" | "published",
        });
      } else {
        // Reset to defaults for create mode
        setFormData({
          routeId: "",
          date: "",
          unitTime: "06:00",
          vehicleId: "",
          seatCount: 0,
          price: 0,
          driverId: undefined,
          driverPhone: "",
          maxParcelsPerVehicle: 0,
          isRecurring: false,
          status: "draft",
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, trip]);

  // Update max parcels when vehicle changes
  useEffect(() => {
    if (formData.vehicleId) {
      const vehicle = vehicles.find((v) => v.id === formData.vehicleId);
      if (vehicle) {
        setFormData((prev) => ({
          ...prev,
          maxParcelsPerVehicle: vehicle.maxParcelsPerVehicle,
          // If seatCount is 0 or exceeds vehicle capacity, default to vehicle capacity
          seatCount:
            prev.seatCount > 0 && prev.seatCount <= vehicle.seatCount
              ? prev.seatCount
              : vehicle.seatCount,
        }));
      }
    }
  }, [formData.vehicleId, vehicles]);

  // Update price when route changes
  useEffect(() => {
    if (formData.routeId) {
      const route = routes.find((r) => r.id === formData.routeId);
      if (route && !trip) {
        // Only auto-set price for new trips
        setFormData((prev) => ({
          ...prev,
          price: route.basePrice,
        }));
      }
    }
  }, [formData.routeId, routes, trip]);

  // Update driver phone when driver changes
  useEffect(() => {
    if (formData.driverId) {
      const driver = apiDrivers.find((d) => d.id === formData.driverId);
      if (driver) {
        setFormData((prev) => ({
          ...prev,
          driverPhone: driver.phone,
        }));
      }
    } else {
      // Clear driver phone when no driver is selected
      setFormData((prev) => ({
        ...prev,
        driverPhone: "",
      }));
    }
  }, [formData.driverId, apiDrivers]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.routeId) newErrors.routeId = "Route is required";
    if (!formData.vehicleId) newErrors.vehicleId = "Vehicle is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (formData.seatCount <= 0)
      newErrors.seatCount = "Seat count must be greater than 0";
    if (formData.price <= 0) newErrors.price = "Price must be greater than 0";

    // Validate seat count against maximum available
    const maxSeats = vehicles.reduce((max, v) => Math.max(max, v.seatCount), 0);
    if (formData.seatCount > maxSeats) {
      newErrors.seatCount = `Seat count cannot exceed maximum vehicle capacity (${maxSeats})`;
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      newErrors.date = "Date cannot be in the past";
    }

    // Validate recurrence pattern if recurring
    if (formData.isRecurring && !formData.recurrencePattern) {
      newErrors.recurrencePattern =
        "Recurrence pattern is required for recurring trips";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateRecurrencePreview = (): string[] => {
    if (
      !formData.isRecurring ||
      !formData.recurrencePattern ||
      !formData.date
    ) {
      return [];
    }

    const previewDates: string[] = [];
    const startDate = new Date(formData.date);
    const endDate = formData.recurrencePattern.endDate
      ? new Date(formData.recurrencePattern.endDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days for preview

    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 1); // Start from next day for preview

    while (currentDate <= endDate && previewDates.length < 7) {
      const dateStr = currentDate.toISOString().split("T")[0];

      if (formData.recurrencePattern.exceptions?.includes(dateStr)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      if (shouldIncludeDate(currentDate, formData.recurrencePattern)) {
        previewDates.push(dateStr);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return previewDates;
  };

  const shouldIncludeDate = (
    date: Date,
    pattern: RecurrencePattern
  ): boolean => {
    const dayOfWeek = date.getDay();

    switch (pattern.type) {
      case "daily":
        return true;
      case "weekdays":
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case "custom":
        return pattern.daysOfWeek?.includes(dayOfWeek) || false;
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onSave(formData);
      if (result.success) {
        onClose();
      } else {
        setErrors({ submit: result.error || "Failed to save trip" });
      }
    } catch {
      setErrors({ submit: "An unexpected error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecurrencePatternChange = (
    field: keyof RecurrencePattern,
    value: string | string[] | number[] | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      recurrencePattern: {
        ...prev.recurrencePattern,
        [field]: value,
      } as RecurrencePattern,
    }));
  };

  const recurrencePreview = generateRecurrencePreview();

  // Don't render if modal is not open
  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="max-w-5xl w-full max-h-[95vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Enhanced Header */}
        <div className="relative p-8 border-b border-gray-100 bg-gradient-to-br from-green-50 via-white to-blue-50">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {mode === "create" ? "Create New Trip" : "Edit Trip"}
                </h2>
                <p className="text-gray-600 mt-1 font-medium">
                  {mode === "create"
                    ? "Schedule a new trip or recurring trip series"
                    : "Update trip details and settings"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-3 rounded-xl hover:bg-gray-100 hover:scale-105"
              type="button"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Main Form Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Trip Details
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Route Selection */}
                <div className="space-y-2">
                  <Label
                    htmlFor="routeId"
                    className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>Route</span>
                  </Label>
                  {loadingRoutes ? (
                    <div className="h-12 border border-gray-200 rounded-md bg-gray-50 flex items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="animate-spin h-4 w-4 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span className="text-sm text-gray-500">
                          Loading routes...
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Select
                      value={formData.routeId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, routeId: value }))
                      }
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20">
                        <SelectValue placeholder="Select a route" />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((route) => (
                          <SelectItem key={route.id} value={route.id}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">
                                {route.destination}
                              </span>
                              <span className="text-green-600 font-semibold ml-2">
                                ₦{route.basePrice.toLocaleString()}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.routeId && (
                    <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors.routeId}</span>
                    </p>
                  )}
                </div>

                {/* Vehicle Selection */}
                <div className="space-y-2">
                  <Label
                    htmlFor="vehicleId"
                    className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 13h2l1-3h12l1 3h2a2 2 0 012 2v2a2 2 0 01-2 2h-1a3 3 0 11-6 0H9a3 3 0 11-6 0H2a2 2 0 01-2-2v-2a2 2 0 012-2z"
                      />
                    </svg>
                    <span>Vehicle</span>
                  </Label>
                  <Select
                    value={formData.vehicleId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, vehicleId: value }))
                    }
                  >
                    <SelectTrigger className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20">
                      <SelectValue placeholder="Select a vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{v.name}</span>
                            <span className="text-gray-600 ml-2">
                              {v.seatCount} seats
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.vehicleId && (
                    <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors.vehicleId}</span>
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label
                    htmlFor="date"
                    className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Date</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                  {errors.date && (
                    <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors.date}</span>
                    </p>
                  )}
                </div>

                {/* Time */}
                <div className="space-y-2">
                  <Label
                    htmlFor="unitTime"
                    className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Departure Time</span>
                  </Label>
                  <Input
                    id="unitTime"
                    type="time"
                    value={formData.unitTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        unitTime: e.target.value,
                      }))
                    }
                    className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>

                {/* Vehicle Seat Count */}
                <div className="space-y-2">
                  <Label
                    htmlFor="seatCount"
                    className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2h5m4-4V4m0 0L7 7m4-3l4 3"
                      />
                    </svg>
                    <span>Vehicle Seat Count</span>
                  </Label>
                  <Input
                    id="seatCount"
                    type="number"
                    min="1"
                    max={
                      vehicles.find((v) => v.id === formData.vehicleId)
                        ?.seatCount || 50
                    }
                    value={formData.seatCount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        seatCount: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="Enter number of seats"
                    className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                  {errors.seatCount && (
                    <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors.seatCount}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1 flex items-center space-x-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Maximum:{" "}
                      {vehicles.find((v) => v.id === formData.vehicleId)
                        ?.seatCount || 0}{" "}
                      seats
                    </span>
                  </p>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label
                    htmlFor="price"
                    className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                    <span>Price (₦)</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors.price}</span>
                    </p>
                  )}
                </div>

                {/* Driver */}
                <div className="space-y-2">
                  <Label
                    htmlFor="driverId"
                    className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>Driver (Optional)</span>
                  </Label>
                  {loadingRoutes || loadingDrivers ? (
                    <div className="h-12 border border-gray-200 rounded-md bg-gray-50 flex items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="animate-spin h-4 w-4 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span className="text-sm text-gray-500">
                          Loading drivers...
                        </span>
                      </div>
                    </div>
                  ) : !formData.routeId ? (
                    <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm text-blue-700 font-medium">
                        Select a route first to see available drivers
                      </p>
                    </div>
                  ) : (
                    <Select
                      value={formData.driverId || ""}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          driverId: value || undefined,
                        }))
                      }
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20">
                        <SelectValue placeholder="No driver assigned" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">
                                  {driver.name}
                                </span>
                                <span className="text-gray-500">
                                  ({driver.phone})
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <svg
                                  className="w-4 h-4 text-yellow-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-yellow-600 font-semibold">
                                  {driver.rating}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                        {availableDrivers.length === 0 && formData.routeId && (
                          <SelectItem value="no-drivers" disabled>
                            <div className="flex items-center space-x-2">
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>No drivers available for this route</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Driver Phone */}
                <div className="space-y-2">
                  <Label
                    htmlFor="driverPhone"
                    className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>Driver Phone (Optional)</span>
                  </Label>
                  <Input
                    id="driverPhone"
                    type="tel"
                    placeholder="+234..."
                    value={formData.driverPhone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        driverPhone: e.target.value,
                      }))
                    }
                    className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                  <p className="text-sm text-gray-500 mt-1 flex items-center space-x-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Will be visible to passengers 5 hours before departure
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Recurring Toggle */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isRecurring: e.target.checked,
                    // Initialize a default recurrence pattern so validation passes
                    recurrencePattern: e.target.checked
                      ? prev.recurrencePattern || { type: "daily" }
                      : undefined,
                  }))
                }
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <Label htmlFor="isRecurring" className="text-sm font-medium">
                Make this a recurring trip
              </Label>
            </div>

            {/* Recurrence Pattern */}
            {formData.isRecurring && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">
                  Recurrence Pattern
                </h3>
                {errors.recurrencePattern && (
                  <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{errors.recurrencePattern}</span>
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="recurrenceType">Repeat</Label>
                    <Select
                      value={formData.recurrencePattern?.type || "daily"}
                      onValueChange={(value) =>
                        handleRecurrencePatternChange("type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select repeat pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekdays">
                          Weekdays (Mon-Fri)
                        </SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.recurrencePattern?.type === "custom" && (
                    <div className="md:col-span-2">
                      <Label>Days of Week</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                          (day, index) => (
                            <label
                              key={day}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  formData.recurrencePattern?.daysOfWeek?.includes(
                                    index
                                  ) || false
                                }
                                onChange={(e) => {
                                  const days =
                                    formData.recurrencePattern?.daysOfWeek ||
                                    [];
                                  const newDays = e.target.checked
                                    ? [...days, index]
                                    : days.filter((d) => d !== index);
                                  handleRecurrencePatternChange(
                                    "daysOfWeek",
                                    newDays
                                  );
                                }}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              />
                              <span className="text-sm">{day}</span>
                            </label>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.recurrencePattern?.endDate || ""}
                    onChange={(e) =>
                      handleRecurrencePatternChange("endDate", e.target.value)
                    }
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty for indefinite recurrence (trips generated up to
                    90 days ahead)
                  </p>
                </div>

                {/* Recurrence Preview */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Preview (Next 7 occurrences)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowRecurrencePreview(!showRecurrencePreview)
                      }
                    >
                      {showRecurrencePreview ? "Hide" : "Show"} Preview
                    </Button>
                  </div>
                  {showRecurrencePreview && (
                    <div className="mt-2 p-4 bg-white rounded-lg border border-gray-200">
                      {recurrencePreview.length > 0 ? (
                        <div>
                          <p className="text-sm text-gray-600 mb-3">
                            These trips will be created automatically:
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {recurrencePreview.map((date) => (
                              <div
                                key={date}
                                className="flex items-center justify-center p-2 bg-green-50 border border-green-200 rounded-md"
                              >
                                <span className="text-sm font-medium text-green-800">
                                  {new Date(date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Recurring trips will be generated up to 90 days
                            ahead and extended automatically
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No occurrences in preview period
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as "draft" | "published",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published (Go Live)</SelectItem>
                </SelectContent>
              </Select>
              {formData.status === "published" && (
                <p className="text-sm text-amber-600 mt-1">
                  ⚠️ Publishing will make this trip visible to passengers
                  immediately
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Enhanced Actions Footer */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100"></div>
              <div className="relative flex items-center justify-between pt-8 border-t border-gray-200 -mx-8 px-8 py-6">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>All fields marked with * are required</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-8 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        {mode === "create" ? "Create Trip" : "Update Trip"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
