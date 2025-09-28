"use client";

import React from "react";
import {
  Users,
  Package,
  DollarSign,
  Calendar,
  Clock,
  MapPin,
  Repeat,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trip, Vehicle } from "@/lib/trips-store";

interface TripCardProps {
  trip: Trip;
  vehicle?: Vehicle;
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
  };
  onEdit?: (trip: Trip) => void;
  onDuplicate?: (trip: Trip) => void;
  onPublish?: (trip: Trip) => void;
  onAssignDriver?: (trip: Trip) => void;
  onExportManifest?: (trip: Trip) => void;
}

export function TripCard({
  trip,
  vehicle,
  driver,
  onEdit,
  onDuplicate,
  onPublish,
  onAssignDriver,
  onExportManifest,
}: TripCardProps) {
  const getStatusBadge = (status: Trip["status"]) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800 border-gray-200",
      published: "bg-green-100 text-green-800 border-green-200",
      live: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-gray-100 text-gray-800 border-gray-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <Badge variant="outline" className={`${colors[status]} font-medium`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSeatAvailabilityBadge = () => {
    const seatsLeft = trip.seatCount - trip.confirmedBookingsCount;

    if (seatsLeft === 0) {
      return {
        text: "Full",
        color: "text-red-600",
        bgColor: "bg-red-100",
        borderColor: "border-red-200",
      };
    } else if (seatsLeft <= 3) {
      return {
        text: "Few Seats Left",
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        borderColor: "border-orange-200",
      };
    } else {
      return {
        text: `${seatsLeft} Seats Left`,
        color: "text-green-600",
        bgColor: "bg-green-100",
        borderColor: "border-green-200",
      };
    }
  };

  const seatAvailability = getSeatAvailabilityBadge();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-green-300 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{new Date(trip.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{trip.unitTime}</span>
            </div>
            {trip.isRecurring && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Repeat className="h-4 w-4" />
                <span>Recurring</span>
              </div>
            )}
          </div>

          {driver && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <Users className="h-4 w-4" />
              <span>{driver.name}</span>
              <span className="text-xs text-gray-500">⭐ {driver.rating}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(trip.status)}
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium border ${seatAvailability.color} ${seatAvailability.bgColor} ${seatAvailability.borderColor}`}
          >
            Seats left: {trip.seatCount - trip.confirmedBookingsCount} /{" "}
            {trip.seatCount}
          </div>
        </div>
      </div>

      {/* Trip Details */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="h-4 w-4 text-gray-600" />
            <span className="text-xs text-gray-600">Passengers</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {trip.confirmedBookingsCount}
          </div>
          <div className="text-xs text-gray-500">/ {trip.seatCount} seats</div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Package className="h-4 w-4 text-gray-600" />
            <span className="text-xs text-gray-600">Parcels</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">0</div>
          <div className="text-xs text-gray-500">
            / {trip.maxParcelsPerVehicle}
          </div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="h-4 w-4 text-gray-600" />
            <span className="text-xs text-gray-600">Price</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            ₦{trip.price.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">per seat</div>
        </div>
      </div>

      {/* Vehicle and Route Info */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-900">
            {vehicle?.name || "Unknown Vehicle"}
          </span>
          <span className="text-blue-700">
            ({vehicle?.seatCount || 0} seats,{" "}
            {vehicle?.maxParcelsPerVehicle || 0} parcels)
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {trip.status === "draft" && onPublish && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPublish(trip)}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              Publish
            </Button>
          )}

          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(trip)}
              className="text-gray-600 border-gray-200 hover:bg-gray-50"
            >
              Edit
            </Button>
          )}

          {onDuplicate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDuplicate(trip)}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              Duplicate
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!driver && onAssignDriver && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAssignDriver(trip)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Assign Driver
            </Button>
          )}

          {onExportManifest && trip.confirmedBookingsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExportManifest(trip)}
              className="text-gray-600 border-gray-200 hover:bg-gray-50"
            >
              Export
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


