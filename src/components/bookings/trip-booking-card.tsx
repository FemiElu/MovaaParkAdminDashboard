"use client";

import React from "react";
import { Trip, Booking } from "@/types";
import { RouteConfig } from "@/types";
import { Parcel } from "@/lib/trips-store";

interface TripBookingCardProps {
  trip: Trip;
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    parkId: string;
    routeIds?: string[];
  };
  route?: RouteConfig;
  bookings: Booking[];
  parcels: Parcel[];
  localCheckedIn?: Set<string>;
  onClick: () => void;
}

export function TripBookingCard({
  trip,
  driver,
  route,
  bookings,
  parcels,
  localCheckedIn = new Set(),
  onClick,
}: TripBookingCardProps) {
  const checkedInCount = bookings.filter(
    (booking) => booking.checkedIn || localCheckedIn.has(booking.id)
  ).length;
  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + booking.amountPaid,
    0
  );

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          {/* Trip Header with Status */}
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-bold text-xl text-gray-900 truncate">
              {route?.destination || "Unknown Route"}
            </h3>
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                trip.status === "published"
                  ? "bg-green-500"
                  : trip.status === "live"
                  ? "bg-blue-500"
                  : "bg-gray-400"
              }`}
              title={trip.status}
            />
          </div>

          {/* Trip Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0"
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
              <span className="text-gray-600">
                {new Date(trip.date).toLocaleDateString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                at {trip.unitTime}
              </span>
            </div>

            {driver && (
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-gray-400 flex-shrink-0"
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
                <span className="text-gray-600">
                  Driver: <span className="font-medium">{driver.name}</span>
                  <span className="ml-2 text-gray-500">({driver.phone})</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Click indicator */}
        <div className="flex-shrink-0 ml-3">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>

      {/* Booking Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {bookings.length}
          </div>
          <div className="text-xs text-gray-600">Passengers</div>
          <div className="text-xs text-gray-500">of {trip.seatCount} seats</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {checkedInCount}
          </div>
          <div className="text-xs text-gray-600">Checked In</div>
          <div className="text-xs text-gray-500">
            {checkedInCount} of {bookings.length}
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            ₦{totalRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Revenue</div>
          <div className="text-xs text-gray-500">
            {bookings.length} bookings
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {parcels.length}
          </div>
          <div className="text-xs text-gray-600">Parcels</div>
          <div className="text-xs text-gray-500">
            of {trip.maxParcelsPerVehicle} max
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Seat Occupancy</span>
          <span>
            {bookings.length}/{trip.seatCount}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(
                trip.seatCount > 0
                  ? (bookings.length / trip.seatCount) * 100
                  : 0,
                100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Check-in Status */}
      {checkedInCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Check-in Progress</span>
            <span className="text-sm font-medium text-green-600">
              {checkedInCount}/{bookings.length} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div
              className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${
                  bookings.length > 0
                    ? (checkedInCount / bookings.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
