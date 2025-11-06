"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  tripApiService,
  Trip as ApiTrip,
  Passenger,
} from "@/lib/trip-api-service";
import { driverApiService } from "@/lib/driver-api-service";
import { BackButton } from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Phone,
  Star,
  ArrowLeft,
  Edit,
  RefreshCw,
} from "lucide-react";

interface TripDetailsClientProps {
  tripId: string;
  parkId: string;
}

export function TripDetailsClient({ tripId }: TripDetailsClientProps) {
  const router = useRouter();
  const [trip, setTrip] = useState<ApiTrip | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [driver, setDriver] = useState<{
    user?: {
      first_name: string;
      last_name: string;
      phone_number: string;
    };
    rating?: number;
    plate_number?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normalize passenger payment state. Backend may return `is_paid: boolean`
  // or `payment_status: string` (e.g. 'PAID' | 'NOT_PAID'). Treat only
  // explicitly paid bookings as confirmed for revenue and confirmed-seat metrics.
  const isPassengerPaid = (p: Passenger | unknown): boolean => {
    const obj = p as Record<string, unknown>;
    if (typeof obj["is_paid"] === "boolean") return obj["is_paid"] as boolean;
    if (typeof obj["payment_status"] === "string") {
      return (obj["payment_status"] as string).toUpperCase() === "PAID";
    }
    if (obj["is_paid"] === "true" || obj["is_paid"] === "1") return true;
    return false;
  };

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching trip details for ID:", tripId);

        // Fetch trip details
        const tripResponse = await tripApiService.getTrip(tripId);
        console.log("Trip API response:", tripResponse);

        if (!tripResponse.success || !tripResponse.data) {
          throw new Error(tripResponse.error || "Failed to fetch trip details");
        }

        const tripData = tripResponse.data;
        console.log("Trip data received:", tripData);
        setTrip(tripData);

        // Fetch passengers
        const passengersResponse = await tripApiService.getTripCustomers(
          tripId
        );
        if (passengersResponse.success) {
          setPassengers(passengersResponse.data);
        }

        // Fetch driver details if driver is assigned
        if (tripData.driver) {
          try {
            const driverResponse = await driverApiService.getDriver(
              tripData.driver
            );
            if (driverResponse.success && driverResponse.data) {
              setDriver(driverResponse.data);
            }
          } catch (driverError) {
            console.warn("Failed to fetch driver details:", driverError);
            // Driver details are optional, so we continue without them
          }
        }

        // Route data is already available in tripData.to_route
      } catch (err) {
        console.error("Error fetching trip details:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load trip details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId]);

  const getStatusBadge = (trip: ApiTrip) => {
    if (trip.is_cancelled) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          Cancelled
        </Badge>
      );
    }
    if (trip.is_completed) {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          Completed
        </Badge>
      );
    }
    if (trip.is_active) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Published
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        Draft
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleEditTrip = () => {
    if (!trip) return;

    if (trip.is_active || trip.is_cancelled || trip.is_completed) {
      alert("Cannot edit published, cancelled, or completed trips");
      return;
    }
    // For now, just show an alert since we don't have an edit page
    alert("Edit functionality will be implemented soon");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <ArrowLeft className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Trip not found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "The trip you're looking for doesn't exist."}
          </p>
          <Button
            onClick={() => router.push("/trips")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trips
          </Button>
        </div>
      </div>
    );
  }


  // compute derived passenger counts using normalized payment status
  const confirmedPassengers = passengers.filter(isPassengerPaid);
  const reservedPassengers = passengers.filter((p) => !isPassengerPaid(p));
  const confirmedCount = confirmedPassengers.length;
  const reservedCount = reservedPassengers.length;
  const confirmedPercent = trip ? Math.round((confirmedCount / trip.total_seats) * 100) : 0;
  const paidRevenue = trip ? confirmedCount * trip.price : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-start gap-3 mb-4">
            <BackButton href="/trips" />
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  Trip Details
                </h1>
                <div className="flex-shrink-0">{getStatusBadge(trip)}</div>
              </div>
              <div className="text-sm sm:text-base text-gray-600 leading-relaxed">
                <span className="font-medium">
                  {trip.to_route?.to_city || "Unknown Route"}
                </span>
                <span className="mx-2">•</span>
                <span>{formatDate(trip.departure_date)}</span>
                <span className="mx-1">at</span>
                <span className="font-medium">
                  {formatTime(trip.departure_time)}
                </span>
              </div>
            </div>
            {/* Desktop Edit Button - Only show for editable trips */}
            {!(trip.is_active || trip.is_cancelled || trip.is_completed) && (
              <Button
                onClick={() => handleEditTrip()}
                variant="outline"
                className="hidden sm:flex flex-shrink-0"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Trip
              </Button>
            )}
          </div>
        </div>

        {/* Trip Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Route Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Route</h3>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">From</p>
              <p className="font-medium text-gray-900">
                {trip?.to_route?.from_state}
              </p>
              <p className="text-sm text-gray-600 mt-2">To</p>
              <p className="font-medium text-gray-900">
                {trip.to_route?.to_city || "Unknown"}
              </p>
              {trip.to_route?.bus_stop && (
                <p className="text-xs text-gray-500 mt-1">
                  Terminal: {trip.to_route.bus_stop}
                </p>
              )}
            </div>
          </div>

          {/* Schedule Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 rounded-lg p-2">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Schedule</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {formatDate(trip.departure_date)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {formatTime(trip.departure_time)}
                </span>
              </div>
              {trip.is_recurrent && (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">
                    Recurring Trip
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Capacity Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-100 rounded-lg p-2">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Capacity</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Confirmed seats</span>
                <span className="font-semibold text-gray-900">
                  {confirmedCount} / {trip.total_seats}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, confirmedPercent))}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Reserved (not paid)</span>
                <span className="font-semibold text-gray-900">{reservedCount} seats</span>
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 rounded-lg p-2">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Pricing</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Price per seat</span>
                <span className="font-bold text-green-600 text-lg">
                  ₦{trip.price.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Revenue (confirmed)</span>
                <span className="font-semibold text-gray-900">₦{paidRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Potential Revenue</span>
                <span className="font-semibold text-gray-900">
                  ₦{(trip.total_seats * trip.price).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Information */}
        {driver && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Driver Information
            </h3>
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="bg-gray-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">
                  {driver.user?.first_name} {driver.user?.last_name}
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {driver.user?.phone_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <span>{driver.rating || "N/A"}</span>
                  </div>
                </div>
                {driver.plate_number && (
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    Vehicle: {driver.plate_number}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Passengers List */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-20 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Passengers (Confirmed: {confirmedCount}, Reserved: {reservedCount})
              </h3>
              {/* Legend: shows what chip colors mean */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                  Confirmed
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                  Reserved
                </span>
              </div>
            </div>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="self-start sm:self-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {passengers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No passengers yet
              </h4>
              <p className="text-gray-600">
                Passengers will appear here once they book this trip.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Passenger
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {passengers.map((passenger) => (
                    <tr key={passenger.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {passenger.first_name} {passenger.last_name}
                          </div>
                       
                          <div className="text-sm text-gray-500">
                          {(typeof passenger.phone_number === 'string' 
                            ? passenger.phone_number
                                .replace(/^(\+?234|234)/, "0")
                                .replace(/\s+/g, "")
                            : passenger.phone_number)}
                        </div>

                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isPassengerPaid(passenger)
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                          title={isPassengerPaid(passenger) ? "Confirmed (paid)" : "Reserved (hold)"}
                        >
                          Seat {passenger.seat_number}
                        </span>
                      </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      passenger.boarding_status === "boarded"
                        ? "bg-green-100 text-green-800"
                        : passenger.boarding_status === "checked_in"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {passenger.boarding_status?.replace("_", " ") || "N/A"}
                  </span>
                </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isPassengerPaid(passenger)
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isPassengerPaid(passenger) ? "Paid" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mobile Edit Button */}
        {!(trip.is_active || trip.is_cancelled || trip.is_completed) && (
          <div className="fixed bottom-20 right-4 sm:hidden z-50">
            <Button
              onClick={() => handleEditTrip()}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full w-14 h-14 shadow-lg"
              title="Edit Trip"
            >
              <Edit className="w-6 h-6" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
