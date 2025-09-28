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
  parkId: string;
  selectedDate: string;
  onClose: () => void;
  onBookingFound: (booking: Booking) => void;
}

export function BookingSearchModal({
  parkId,
  selectedDate,
  onClose,
  onBookingFound,
}: BookingSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Booking[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<"manual" | "qr">("manual");
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search term");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      // Search for bookings by ID, name, or phone
      const response = await fetch(
        `/api/bookings/search?parkId=${parkId}&date=${selectedDate}&query=${encodeURIComponent(
          searchQuery
        )}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSearchResults(result.data || []);
          if (result.data.length === 0) {
            setError("No bookings found matching your search");
          }
        } else {
          setError(result.error || "Search failed");
        }
      } else {
        setError("Failed to search bookings");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Network error - please try again");
    } finally {
      setIsSearching(false);
    }
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
    return {
      passenger: booking.passengerName,
      phone: booking.passengerPhone,
      seat: booking.seatNumber,
      amount: booking.amountPaid,
      status: booking.checkedIn ? "Checked In" : "Pending Check-in",
      tripDate: booking.tripId.split("_")[2] || "Unknown", // Extract date from trip ID
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Search Passengers
            </h2>
            <p className="text-sm text-gray-600 mt-1">
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
        <div className="p-6 space-y-6">
          {/* Search Type Toggle */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSearchType("manual")}
              className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
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
              className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
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
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <QrCodeIcon className="h-8 w-8 text-blue-600" />
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
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {info.passenger}
                            </div>
                            <div className="text-xs text-gray-500">
                              Seat {info.seat} • Trip: {info.tripDate}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            ₦{info.amount.toLocaleString()}
                          </div>
                          <div
                            className={`text-xs ${
                              info.status === "Checked In"
                                ? "text-green-600"
                                : "text-blue-600"
                            }`}
                          >
                            {info.status}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <PhoneIcon className="w-3 h-3 mr-1" />
                        {info.phone}
                      </div>
                    </div>
                  );
                })}
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
