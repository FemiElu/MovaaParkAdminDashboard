"use client";

import { useState } from "react";
import { LiveBooking } from "@/lib/live-bookings";
import {
  XMarkIcon,
  UserIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

interface BookingDetailsModalProps {
  booking: LiveBooking;
  onClose: () => void;
  onUpdate: (updatedBooking: LiveBooking) => void;
}

export function BookingDetailsModal({
  booking,
  onClose,
  onUpdate,
}: BookingDetailsModalProps) {
  const [updating, setUpdating] = useState(false);

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

    return `${minutes} minutes, ${seconds} seconds`;
  };

  const handleStatusUpdate = async (newStatus: LiveBooking["status"]) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const result = await response.json();
        onUpdate(result.data);
      } else {
        const error = await response.json();
        alert(`Failed to update booking: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Failed to update booking status");
    } finally {
      setUpdating(false);
    }
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Booking Details
            </h2>
            <p className="text-sm text-gray-600">ID: {booking.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Timer */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                booking.status
              )}`}
            >
              {booking.status}
            </span>

            {timeRemaining && timeRemaining !== "Expired" && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ClockIcon className="h-4 w-4" />
                <span>Expires in: {timeRemaining}</span>
              </div>
            )}
          </div>

          {/* Trip Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <MapPinIcon className="h-4 w-4 mr-2" />
              Trip Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Destination:</span>
                <p className="font-medium">{booking.destination}</p>
              </div>
              <div>
                <span className="text-gray-600">Departure:</span>
                <p className="font-medium">
                  {booking.departureDate} at {booking.departureTime}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Slots:</span>
                <p className="font-medium">{booking.slotNumbers.join(", ")}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Amount:</span>
                <p className="font-medium">
                  ₦{booking.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Passenger Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <UserIcon className="h-4 w-4 mr-2" />
              Passenger Information
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Full Name:</span>
                <p className="font-medium">{booking.passenger.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">{booking.passenger.phone}</p>
                  <a
                    href={`tel:${booking.passenger.phone}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <PhoneIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div>
                <span className="text-gray-600">Address:</span>
                <p className="font-medium">{booking.passenger.address}</p>
              </div>
            </div>
          </div>

          {/* Next of Kin Information */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <UserGroupIcon className="h-4 w-4 mr-2" />
              Next of Kin
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Full Name:</span>
                <p className="font-medium">
                  {booking.passenger.nextOfKin.name}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">
                    {booking.passenger.nextOfKin.phone}
                  </p>
                  <a
                    href={`tel:${booking.passenger.nextOfKin.phone}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <PhoneIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div>
                <span className="text-gray-600">Relationship:</span>
                <p className="font-medium">
                  {booking.passenger.nextOfKin.relationship}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Address:</span>
                <p className="font-medium">
                  {booking.passenger.nextOfKin.address}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              Payment Breakdown
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Amount:</span>
                <span className="font-medium">
                  ₦{booking.baseAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service Charge:</span>
                <span className="font-medium">
                  ₦{booking.systemServiceCharge.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>Total Amount:</span>
                <span>₦{booking.totalAmount.toLocaleString()}</span>
              </div>
              {booking.paymentReference && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Reference:</span>
                  <span className="font-medium">
                    {booking.paymentReference}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Reserved:</span>
                <span>{formatDateTime(booking.reservedAt)}</span>
              </div>
              {booking.confirmedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Confirmed:</span>
                  <span>{formatDateTime(booking.confirmedAt)}</span>
                </div>
              )}
              {booking.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span>{formatDateTime(booking.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Actions */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Admin Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              {booking.status === "RESERVED" && (
                <>
                  <button
                    onClick={() => handleStatusUpdate("CONFIRMED")}
                    disabled={updating}
                    className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors disabled:opacity-50"
                  >
                    {updating ? "Updating..." : "Confirm Payment"}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("CANCELLED")}
                    disabled={updating}
                    className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors disabled:opacity-50"
                  >
                    {updating ? "Updating..." : "Cancel Booking"}
                  </button>
                </>
              )}

              {booking.status === "CONFIRMED" && (
                <>
                  <button
                    onClick={() => handleStatusUpdate("COMPLETED")}
                    disabled={updating}
                    className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors disabled:opacity-50"
                  >
                    {updating ? "Updating..." : "Mark Completed"}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("CANCELLED")}
                    disabled={updating}
                    className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors disabled:opacity-50"
                  >
                    {updating ? "Updating..." : "Cancel Booking"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
