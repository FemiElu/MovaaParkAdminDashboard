"use client";

import Link from "next/link";
import {
  Users,
  Package,
  DollarSign,
  User,
  UserPlus,
  Edit,
  Calendar,
  Repeat,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trip, tripsStore } from "@/lib/trips-store";
import { AssignDriverModal } from "./assign-driver-modal";
import { useState } from "react";

interface EnhancedTripCardProps {
  trip: Trip;
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
  onEdit?: (trip: Trip) => void;
}

export function EnhancedTripCard({
  trip,
  driver,
  drivers,
  bookingsCount,
  parcelsCount,
  onEdit,
}: EnhancedTripCardProps) {
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
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
    <div className="block group">
      <Link href={`/trips/${trip.id}`} className="block">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:border-green-300 transition-all duration-200 group-hover:scale-[1.02]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(trip.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    Managed Offline
                  </span>
                </div>
                {trip.isRecurring && (
                  <div className="flex items-center gap-1">
                    <Repeat className="h-4 w-4" />
                    <span>Recurring</span>
                  </div>
                )}
              </div>
              {driver && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{driver.name}</span>
                  <span className="text-xs text-gray-500">
                    ⭐ {driver.rating}
                  </span>
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
              <div className="flex items-center gap-4">
                <span>₦{trip.price.toLocaleString()}</span>
                <span>{trip.unitTime}</span>
                {trip.confirmedBookingsCount > 0 && (
                  <span>{trip.confirmedBookingsCount} confirmed</span>
                )}
                {trip.confirmedBookingsCount > 0 &&
                  bookingsCount > trip.confirmedBookingsCount && (
                    <span className="text-orange-600">
                      {bookingsCount - trip.confirmedBookingsCount} pending
                    </span>
                  )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(trip);
                  }}
                  className="text-gray-600 border-gray-200 hover:bg-gray-50 flex-1 sm:flex-none"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              )}
              {!driver ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAssignDriverModal(true);
                  }}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 flex-1 sm:flex-none"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Assign Driver</span>
                  <span className="sm:hidden">Assign</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAssignDriverModal(true);
                  }}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 flex-1 sm:flex-none"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Change Driver</span>
                  <span className="sm:hidden">Change</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Assign Driver Modal - Outside Link to prevent navigation */}
      <AssignDriverModal
        isOpen={showAssignDriverModal}
        onClose={() => setShowAssignDriverModal(false)}
        trip={trip}
        drivers={drivers}
        onAssign={handleDriverAssign}
      />
    </div>
  );
}
