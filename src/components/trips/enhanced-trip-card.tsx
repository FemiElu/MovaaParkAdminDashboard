"use client";

import Link from "next/link";
import { Users, Package, DollarSign, User, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trip, Vehicle, tripsStore } from "@/lib/trips-store";
import { AssignDriverModal } from "./assign-driver-modal";
import { useState } from "react";

interface EnhancedTripCardProps {
  trip: Trip;
  vehicle?: Vehicle;
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
  };
  drivers: Array<{
    id: string;
    name: string;
    phone: string;
    rating: number;
    parkId: string;
  }>;
  bookingsCount: number;
  parcelsCount: number;
}

export function EnhancedTripCard({
  trip,
  vehicle,
  driver,
  drivers,
  bookingsCount,
  parcelsCount,
}: EnhancedTripCardProps) {
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const getStatusBadge = (status: Trip["status"]) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-800 border-blue-200",
      active: "bg-green-100 text-green-800 border-green-200",
      completed: "bg-gray-100 text-gray-800 border-gray-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <Badge variant="outline" className={`${colors[status]} font-medium`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getAvailabilityStatus = () => {
    const utilization = (bookingsCount / trip.seatCount) * 100;

    if (utilization >= 90) {
      return {
        text: "Almost Full",
        color: "text-red-600",
        bgColor: "bg-red-50",
      };
    } else if (utilization >= 70) {
      return {
        text: "Filling Up",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      };
    } else {
      return {
        text: "Available",
        color: "text-green-600",
        bgColor: "bg-green-50",
      };
    }
  };

  const availability = getAvailabilityStatus();

  // Calculate total revenue from confirmed bookings
  const totalRevenue = tripsStore
    .getBookings(trip.id)
    .filter((booking) => booking.bookingStatus === "confirmed")
    .reduce((sum, booking) => sum + booking.amountPaid, 0);

  const handleDriverAssign = async (driverId: string) => {
    try {
      const response = await fetch(`/api/trips/${trip.id}/assign-driver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ driverId }),
      });

      if (response.ok) {
        setShowAssignDriverModal(false);
        // Refresh the page to show updated driver
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to assign driver: ${error.message}`);
      }
    } catch (error) {
      console.error("Error assigning driver:", error);
      alert("Failed to assign driver. Please try again.");
    }
  };

  return (
    <Link href={`/trips/${trip.id}`} className="block group">
      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-green-300 transition-all duration-200 group-hover:scale-[1.02]">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{vehicle?.name || "Unknown Vehicle"}</span>
              </div>
              {driver && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{driver.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(trip.status)}
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${availability.color} ${availability.bgColor}`}
            >
              {availability.text}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-xs text-gray-600">Passengers</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {bookingsCount}
            </div>
            <div className="text-xs text-gray-500">
              / {trip.seatCount} seats
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Package className="h-4 w-4 text-gray-600" />
              <span className="text-xs text-gray-600">Parcels</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {parcelsCount}
            </div>
            <div className="text-xs text-gray-500">
              / {trip.maxParcelsPerVehicle}
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <span className="text-xs text-gray-600">Revenue</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              ₦{totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">from passengers</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            {trip.confirmedBookingsCount > 0 && (
              <span>{trip.confirmedBookingsCount} confirmed</span>
            )}
            {trip.confirmedBookingsCount > 0 &&
              bookingsCount > trip.confirmedBookingsCount && (
                <span className="ml-2 text-orange-600">
                  {bookingsCount - trip.confirmedBookingsCount} pending
                </span>
              )}
          </div>
          <div className="flex items-center gap-2">
            {!driver ? (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAssignDriverModal(true);
                }}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Assign Driver
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">
                  Driver: <span className="font-medium">{driver.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAssignDriverModal(true);
                  }}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Change
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              View Details
            </Button>
          </div>
        </div>
      </div>

      {/* Assign Driver Modal */}
      <AssignDriverModal
        isOpen={showAssignDriverModal}
        onClose={() => setShowAssignDriverModal(false)}
        trip={trip}
        drivers={drivers}
        onAssign={handleDriverAssign}
      />
    </Link>
  );
}
