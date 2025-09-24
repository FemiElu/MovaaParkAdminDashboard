"use client";

import React, { useState } from "react";
import {
  Search,
  QrCode,
  User,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tripsStore, Booking } from "@/lib/trips-store";

interface CheckinFlowProps {
  tripId: string;
  onCheckinComplete?: () => void;
}

export function CheckinFlow({ tripId, onCheckinComplete }: CheckinFlowProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Booking[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [checkinMode, setCheckinMode] = useState<"search" | "qr">("search");

  const trip = tripsStore.getTrip(tripId);
  const bookings = tripsStore.getBookings(tripId);

  const searchBookings = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Search by phone, booking ID, or passenger name
    const results = bookings.filter((booking) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        booking.passengerPhone.toLowerCase().includes(searchLower) ||
        booking.id.toLowerCase().includes(searchLower) ||
        booking.passengerName.toLowerCase().includes(searchLower)
      );
    });

    setSearchResults(results);
    setIsSearching(false);
  };

  const handleCheckin = async (booking: Booking) => {
    try {
      const result = tripsStore.checkInBooking(tripId, booking.id);

      if (result.success) {
        setSelectedBooking(booking);
        // Refresh search results to show updated status
        searchBookings();
        onCheckinComplete?.();
      } else {
        alert(`Check-in failed: ${result.reason}`);
      }
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Check-in failed. Please try again.");
    }
  };

  const handleSeatReassignment = (booking: Booking, newSeatNumber: number) => {
    // This would typically call an API to reassign the seat
    alert(
      `Seat reassignment for ${booking.passengerName} to seat ${newSeatNumber} would be implemented here.`
    );
  };

  if (!trip) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Trip not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Passenger Check-in
        </h2>
        <p className="text-sm text-gray-600">
          Check in passengers for {new Date(trip.date).toLocaleDateString()} at{" "}
          {trip.unitTime}
        </p>
      </div>

      {/* Mode Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex space-x-2 mb-4">
          <Button
            variant={checkinMode === "search" ? "default" : "outline"}
            onClick={() => setCheckinMode("search")}
            className={
              checkinMode === "search" ? "bg-green-600 hover:bg-green-700" : ""
            }
          >
            <Search className="w-4 h-4 mr-2" />
            Search & Check-in
          </Button>
          <Button
            variant={checkinMode === "qr" ? "default" : "outline"}
            onClick={() => setCheckinMode("qr")}
            className={
              checkinMode === "qr" ? "bg-green-600 hover:bg-green-700" : ""
            }
          >
            <QrCode className="w-4 h-4 mr-2" />
            QR Code Scanner
          </Button>
        </div>

        {checkinMode === "search" ? (
          /* Search Mode */
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search by phone, booking ID, or passenger name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && searchBookings()}
                />
              </div>
              <Button
                onClick={searchBookings}
                disabled={isSearching || !searchTerm.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">
                  Search Results ({searchResults.length})
                </h3>
                {searchResults.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="font-medium">
                              {booking.passengerName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-600">
                              {booking.passengerPhone}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              booking.checkedIn
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }
                          >
                            Seat {booking.seatNumber}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>
                              NOK: {booking.nokName} ({booking.nokPhone})
                            </span>
                          </div>
                          <div className="mt-1">
                            Status:{" "}
                            {booking.checkedIn ? (
                              <span className="text-green-600 font-medium">
                                ✓ Checked In
                              </span>
                            ) : (
                              <span className="text-gray-600">
                                Not Checked In
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {booking.checkedIn ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">
                              Checked In
                            </span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleCheckin(booking)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Check In
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleSeatReassignment(booking, booking.seatNumber)
                          }
                          className="text-gray-600 border-gray-200 hover:bg-gray-50"
                        >
                          Reassign Seat
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchTerm && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-8">
                <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">
                  No passengers found matching your search
                </p>
              </div>
            )}
          </div>
        ) : (
          /* QR Code Mode */
          <div className="text-center py-12">
            <div className="mx-auto h-32 w-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <QrCode className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              QR Code Scanner
            </h3>
            <p className="text-gray-600 mb-4">
              Point your camera at a passenger's QR code to check them in
            </p>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => alert("QR scanner would be implemented here")}
            >
              Start QR Scanner
            </Button>
          </div>
        )}
      </div>

      {/* Trip Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4">Trip Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {bookings.filter((b) => b.checkedIn).length}
            </div>
            <div className="text-sm text-blue-600">Checked In</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-600">
              {bookings.filter((b) => !b.checkedIn).length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {trip.confirmedBookingsCount}
            </div>
            <div className="text-sm text-green-600">Total Bookings</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">
              {trip.seatCount - trip.confirmedBookingsCount}
            </div>
            <div className="text-sm text-orange-600">Available Seats</div>
          </div>
        </div>
      </div>
    </div>
  );
}
