"use client";

import React, { useState } from "react";
import { Trip, Booking } from "@/types";
import {
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { CheckInValidator, CheckInContext } from "@/lib/checkin-validation";
import { useToast } from "@/components/ui/toast";
import { AuditLogger, auditActions, getUserContext } from "@/lib/audit-logger";

interface PassengerManifestModalProps {
  trip: Trip;
  bookings: Booking[];
  onClose: () => void;
  onCheckIn: (bookingId: string) => Promise<void>;
  onLocalCheckIn?: (bookingId: string) => void;
}

export function PassengerManifestModal({
  trip,
  bookings,
  onClose,
  onCheckIn,
  onLocalCheckIn,
}: PassengerManifestModalProps) {
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>(
    {}
  );
  const [failedCheckIns, setFailedCheckIns] = useState<Set<string>>(new Set());
  const [localCheckedIn, setLocalCheckedIn] = useState<Set<string>>(new Set());
  const { addToast } = useToast();

  const handleCheckIn = async (bookingId: string) => {
    // Clear any previous validation errors
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[bookingId];
      return newErrors;
    });

    // Find the booking
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      addToast({
        type: "error",
        title: "Booking Not Found",
        message: "The selected booking could not be found.",
      });
      return;
    }

    // Validate check-in
    const currentDate = new Date().toISOString().split("T")[0];
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    const validationContext: CheckInContext = {
      bookingId,
      tripId: trip.id,
      currentDate,
      currentTime,
      parkId: trip.parkId,
    };

    const validation = CheckInValidator.validateCheckIn(
      booking,
      trip,
      validationContext
    );

    if (!validation.isValid) {
      const errorMessage = CheckInValidator.getErrorMessage(validation);
      setValidationErrors((prev) => ({
        ...prev,
        [bookingId]: errorMessage,
      }));

      addToast({
        type: "error",
        title: "Check-in Failed",
        message: errorMessage,
      });
      return;
    }

    // Proceed with check-in
    setCheckingIn(bookingId);
    const currentAttempts = retryAttempts[bookingId] || 0;
    const maxRetries = 3;

    try {
      await onCheckIn(bookingId);

      // Success - clear retry state and mark as checked in
      setRetryAttempts((prev) => {
        const newAttempts = { ...prev };
        delete newAttempts[bookingId];
        return newAttempts;
      });
      setFailedCheckIns((prev) => {
        const newFailed = new Set(prev);
        newFailed.delete(bookingId);
        return newFailed;
      });
      setLocalCheckedIn((prev) => new Set(prev).add(bookingId));

      // Notify parent component about local check-in
      if (onLocalCheckIn) {
        onLocalCheckIn(bookingId);
      }

      // Log successful check-in
      try {
        const userContext = getUserContext();
        await AuditLogger.log({
          action: auditActions.BOOKING_CHECKED_IN,
          entityType: "booking",
          entityId: bookingId,
          userId: "admin", // In a real app, this would come from the session
          parkId: trip.parkId,
          details: {
            passengerName: booking.passengerName,
            passengerPhone: booking.passengerPhone,
            seatNumber: booking.seatNumber,
            amountPaid: booking.amountPaid,
            tripId: trip.id,
            routeId: trip.routeId,
            tripDate: trip.date,
            tripTime: trip.unitTime,
            checkInMethod: "manual", // Could be 'qr_scan' or 'manual'
            retryAttempts: currentAttempts,
          },
          ...userContext,
        });
      } catch (auditError) {
        console.error("Failed to log check-in audit:", auditError);
        // Don't fail the check-in if audit logging fails
      }

      // Show success toast
      addToast({
        type: "success",
        title: "Passenger Checked In",
        message: `Checked in ${booking.passengerName} successfully.`,
      });
    } catch (error) {
      console.error("Check-in error:", error);

      const newAttempts = currentAttempts + 1;
      setRetryAttempts((prev) => ({
        ...prev,
        [bookingId]: newAttempts,
      }));

      if (newAttempts < maxRetries) {
        // Show retry message
        addToast({
          type: "warning",
          title: "Check-in Failed",
          message: `Attempt ${newAttempts} failed. Retrying... (${
            maxRetries - newAttempts
          } attempts left)`,
          duration: 3000,
        });

        // Auto-retry after a short delay
        setTimeout(() => {
          handleCheckIn(bookingId);
        }, 2000);
      } else {
        // Max retries reached
        setFailedCheckIns((prev) => new Set(prev).add(bookingId));

        // Log failed check-in after max retries
        try {
          const userContext = getUserContext();
          await AuditLogger.log({
            action: "booking_checkin_failed",
            entityType: "booking",
            entityId: bookingId,
            userId: "admin",
            parkId: trip.parkId,
            details: {
              passengerName: booking.passengerName,
              passengerPhone: booking.passengerPhone,
              seatNumber: booking.seatNumber,
              tripId: trip.id,
              routeId: trip.routeId,
              tripDate: trip.date,
              tripTime: trip.unitTime,
              failureReason: "max_retries_exceeded",
              retryAttempts: newAttempts,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            ...userContext,
          });
        } catch (auditError) {
          console.error("Failed to log failed check-in audit:", auditError);
        }

        addToast({
          type: "error",
          title: "Check-in Failed",
          message: `Failed to check in ${booking.passengerName} after ${maxRetries} attempts. Please try again manually.`,
          duration: 8000,
        });
      }
    } finally {
      setCheckingIn(null);
    }
  };

  const checkedInCount = bookings.filter(
    (booking) => booking.checkedIn || localCheckedIn.has(booking.id)
  ).length;
  const pendingCount = bookings.filter(
    (booking) => !booking.checkedIn && !localCheckedIn.has(booking.id)
  ).length;

  const getStatusIndicator = (booking: Booking) => {
    const isCheckedIn = booking.checkedIn || localCheckedIn.has(booking.id);

    if (isCheckedIn) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-xs font-medium text-green-800">Checked In</span>
        </div>
      );
    }

    if (booking.paymentStatus === "pending") {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-xs font-medium text-yellow-800">
            Pending Payment
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
        <span className="text-xs font-medium text-orange-800">Ready</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 truncate">
              Passenger Manifest
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Trip to {trip.routeId} •{" "}
              {new Date(trip.date).toLocaleDateString()} at {trip.unitTime}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-600">
                Total Passengers:{" "}
                <span className="font-medium">{bookings.length}</span>
              </span>
              <span className="text-sm text-green-600">
                Checked In:{" "}
                <span className="font-medium">{checkedInCount}</span>
              </span>
              <span className="text-sm text-blue-600">
                Pending: <span className="font-medium">{pendingCount}</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <UserIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No passengers booked
              </h3>
              <p className="text-gray-600">
                This trip has no passenger bookings yet.
              </p>
            </div>
          ) : (
            <div className="p-6">
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Passenger
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Next of Kin
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.passengerName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {booking.id.slice(-8)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {booking.passengerPhone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {booking.nokName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.nokPhone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              Seat {booking.seatNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ₦{booking.amountPaid.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusIndicator(booking)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-2">
                              {validationErrors[booking.id] && (
                                <div className="flex items-center space-x-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                  <ExclamationTriangleIcon className="w-3 h-3" />
                                  <span>{validationErrors[booking.id]}</span>
                                </div>
                              )}

                              {!booking.checkedIn &&
                              !localCheckedIn.has(booking.id) &&
                              booking.paymentStatus === "confirmed" ? (
                                <div className="space-y-1">
                                  <button
                                    onClick={() => handleCheckIn(booking.id)}
                                    disabled={checkingIn === booking.id}
                                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                                      failedCheckIns.has(booking.id)
                                        ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                                        : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                                    }`}
                                  >
                                    {checkingIn === booking.id ? (
                                      <>
                                        <svg
                                          className="animate-spin -ml-1 mr-2 h-3 w-3 text-white"
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
                                        Checking In...
                                      </>
                                    ) : failedCheckIns.has(booking.id) ? (
                                      <>
                                        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                        Retry Check In
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                                        Check In
                                      </>
                                    )}
                                  </button>

                                  {retryAttempts[booking.id] > 0 && (
                                    <div className="text-xs text-orange-600">
                                      Attempt {retryAttempts[booking.id]}/3
                                    </div>
                                  )}
                                </div>
                              ) : booking.checkedIn ||
                                localCheckedIn.has(booking.id) ? (
                                <span className="text-sm text-green-600 font-medium">
                                  ✓ Checked In
                                </span>
                              ) : (
                                <span className="text-sm text-gray-500">
                                  Payment Required
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.passengerName}
                          </div>
                          <div className="text-xs text-gray-500">
                            Seat {booking.seatNumber} • ID:{" "}
                            {booking.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                      {getStatusIndicator(booking)}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">
                          {booking.passengerPhone}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        NOK: {booking.nokName} ({booking.nokPhone})
                      </div>
                      <div className="text-gray-600">
                        Amount: ₦{booking.amountPaid.toLocaleString()}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                      {validationErrors[booking.id] && (
                        <div className="flex items-center space-x-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          <ExclamationTriangleIcon className="w-3 h-3" />
                          <span>{validationErrors[booking.id]}</span>
                        </div>
                      )}

                      {!booking.checkedIn &&
                      !localCheckedIn.has(booking.id) &&
                      booking.paymentStatus === "confirmed" ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleCheckIn(booking.id)}
                            disabled={checkingIn === booking.id}
                            className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                              failedCheckIns.has(booking.id)
                                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                                : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                            }`}
                          >
                            {checkingIn === booking.id ? (
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
                                Checking In...
                              </>
                            ) : failedCheckIns.has(booking.id) ? (
                              <>
                                <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                                Retry Check In
                              </>
                            ) : (
                              <>
                                <CheckCircleIcon className="w-4 h-4 mr-2" />
                                Check In Passenger
                              </>
                            )}
                          </button>

                          {retryAttempts[booking.id] > 0 && (
                            <div className="text-center text-xs text-orange-600">
                              Attempt {retryAttempts[booking.id]}/3
                            </div>
                          )}
                        </div>
                      ) : booking.checkedIn ||
                        localCheckedIn.has(booking.id) ? (
                        <div className="text-center text-green-600 font-medium">
                          ✓ Passenger Checked In
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">
                          Payment Required Before Check-in
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Close Manifest
          </button>
        </div>
      </div>
    </div>
  );
}
