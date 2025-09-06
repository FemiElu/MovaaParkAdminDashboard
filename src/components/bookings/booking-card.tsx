"use client";

import { LiveBooking } from "@/lib/live-bookings";
import {
  ClockIcon,
  UserIcon,
  MapPinIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

interface BookingCardProps {
  booking: LiveBooking;
  onClick: () => void;
}

export function BookingCard({ booking, onClick }: BookingCardProps) {
  const getStatusColor = (status: LiveBooking["status"]) => {
    switch (status) {
      case "RESERVED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border-green-200";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTimeRemaining = () => {
    if (booking.status !== "RESERVED" || !booking.expiresAt) return null;

    const now = Date.now();
    const remaining = booking.expiresAt - now;

    if (remaining <= 0) return "Expired";

    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const timeRemaining = getTimeRemaining();
  const isExpiringSoon =
    timeRemaining &&
    timeRemaining !== "Expired" &&
    booking.expiresAt &&
    booking.expiresAt - Date.now() < 5 * 60 * 1000; // Less than 5 minutes

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header with Status and Timer */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
            booking.status
          )}`}
        >
          {booking.status}
        </span>

        {timeRemaining && timeRemaining !== "Expired" && (
          <div
            className={`flex items-center space-x-1 text-xs ${
              isExpiringSoon ? "text-red-600" : "text-gray-500"
            }`}
          >
            <ClockIcon className="h-3 w-3" />
            <span className={isExpiringSoon ? "font-medium animate-pulse" : ""}>
              {timeRemaining}
            </span>
          </div>
        )}
      </div>

      {/* Passenger Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2">
          <UserIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {booking.passenger.name}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <MapPinIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{booking.destination}</span>
          <span className="text-xs text-gray-500">
            • {booking.slotNumbers.length} slot
            {booking.slotNumbers.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            ₦{booking.totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Trip Details */}
      <div className="border-t pt-3">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            Departure: {booking.departureDate} at {booking.departureTime}
          </span>
          <span>#{booking.id.slice(-6)}</span>
        </div>

        {booking.paymentReference && (
          <div className="text-xs text-gray-500 mt-1">
            Payment: {booking.paymentReference}
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="mt-2 pt-2 border-t">
        <a
          href={`tel:${booking.passenger.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          📞 {booking.passenger.phone}
        </a>
      </div>
    </div>
  );
}



