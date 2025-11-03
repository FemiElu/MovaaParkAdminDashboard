"use client";

import React, { useState } from "react";
import { Booking } from "@/types";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  QrCodeIcon,
  UserIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { QRScanner } from "./qr-scanner";

interface BookingSearchModalProps {
  bookings: Booking[];
  onClose: () => void;
  onBookingFound: (booking: Booking) => void;
}

export function BookingSearchModal({
  bookings,
  onClose,
  onBookingFound,
}: BookingSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Booking[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<"manual" | "qr">("manual");
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search term");
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setError(null);
    // Case-insensitive, multi-field substring search
    const q = searchQuery.trim().toLowerCase();
    const results = bookings.filter(
      (b) =>
        b.passengerName?.toLowerCase().includes(q) ||
        b.passengerPhone?.toLowerCase().includes(q) ||
        String(b.seatNumber).toLowerCase().includes(q) ||
        b.bookingId?.toLowerCase()?.includes(q) ||
        b.nokName?.toLowerCase().includes(q) ||
        b.nokPhone?.toLowerCase().includes(q)
    );
    setSearchResults(results);
    if (results.length === 0)
      setError("No bookings found matching your search");
    setIsSearching(false);
  };

  const handleQRScan = () => {
    setShowQRScanner(true);
  };

  const handleQRResult = (result: string) => {
    setShowQRScanner(false);
    setSearchQuery(result);
    setSearchType("manual");
    // Automatically search with the scanned result
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleQRScannerClose = () => {
    setShowQRScanner(false);
  };

  const handleBookingSelect = (booking: Booking) => {
    onBookingFound(booking);
  };

  const formatBookingInfo = (booking: Booking) => {
    const tripDate = booking.trip?.departureDate || "Unknown";
    const tripTime = booking.trip?.departureTime || "";
    return {
      passenger: booking.passengerName,
      phone: booking.passengerPhone,
      seat: booking.seatNumber,
      amount: booking.amountPaid || 0,
      status: booking.isCheckedIn ? "Checked In" : "Pending Check-in",
      tripDate,
      tripTime,
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[100%] sm:max-w-xl md:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              Search Passengers
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Find passengers by Ticket ID, name, or phone number
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          {/* Search Type Toggle */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSearchType("manual")}
              className={`flex-1 flex items-center justify-center px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                searchType === "manual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
              Manual Search
            </button>
            <button
              onClick={() => setSearchType("qr")}
              className={`flex-1 flex items-center justify-center px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                searchType === "qr"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <QrCodeIcon className="w-4 h-4 mr-2" />
              QR Scan
            </button>
          </div>

          {/* Search Input */}
          {searchType === "manual" ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Search by Ticket ID, name, or phone
                </label>
                <div className="relative">
                  <input
                    id="search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search by Ticket ID, name or phone … or tap to scan QR"
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                    Searching...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                    Search Passengers
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <QrCodeIcon className="h-8 w-8 text-green-700" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                QR Code Scanner
              </h3>
              <p className="text-gray-600 mb-6">
                Point your camera at the passenger&apos;s QR ticket to
                automatically find their booking
              </p>
              <button
                onClick={handleQRScan}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-colors"
              >
                <QrCodeIcon className="w-5 h-5 mr-2" />
                Start QR Scan
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  {error === "No bookings found matching your search"
                    ? "Ticket not found or invalid"
                    : "Search Error"}
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">
                Search Results ({searchResults.length})
              </h3>
              <div className="space-y-2">
                {searchResults.map((booking) => {
                  const info = formatBookingInfo(booking);
                  return (
                    <div
                      key={booking.id}
                      onClick={() => handleBookingSelect(booking)}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-5 w-5 text-green-700" />
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {info.passenger}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              Seat {info.seat} • {info.tripDate} {info.tripTime}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            ₦{Number(info.amount || 0).toLocaleString()}
                          </div>
                          <div
                            className={`text-xs font-medium ${
                              info.status === "Checked In"
                                ? "text-green-600"
                                : "text-orange-600"
                            }`}
                          >
                            {info.status}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
                        <div className="flex items-center">
                          <PhoneIcon className="w-3 h-3 mr-1" />
                          {info.phone}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {booking.id.slice(-8)}
                        </div>
                      </div>

                      {/* Status Badge - No separate buttons, click whole card */}
                      <div className="mt-3 pt-3 border-t">
                        {booking.isCheckedIn ? (
                          <div className="text-center py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md">
                            ✓ Already Checked In
                          </div>
                        ) : booking.paymentStatus === "confirmed" ? (
                          <div className="text-center py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md">
                            Click to view and check in
                          </div>
                        ) : (
                          <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded-md">
                            Payment Required - View Details
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner onScan={handleQRResult} onClose={handleQRScannerClose} />
      )}
    </div>
  );
}
