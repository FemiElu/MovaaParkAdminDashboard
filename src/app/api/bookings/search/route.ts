import { NextRequest, NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";
import { Booking } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parkId = searchParams.get("parkId");
    const date = searchParams.get("date");
    const query = searchParams.get("query");

    if (!parkId || !date || !query) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get all trips for the park and date
    const trips = tripsStore.getTrips(parkId, date);
    const allBookings: (Booking & {
      tripId: string;
      tripDate: string;
      routeId: string;
    })[] = [];

    // Collect all bookings from all trips
    trips.forEach((trip) => {
      const bookings = tripsStore.getBookings(trip.id);
      bookings.forEach((booking) => {
        allBookings.push({
          ...booking,
          tripId: trip.id,
          tripDate: trip.date,
          routeId: trip.routeId,
        });
      });
    });

    // Search bookings by query - EXACT match only for safety
    const searchTerm = query.toLowerCase().trim();
    const matchingBookings = allBookings.filter((booking) => {
      const passengerNameLower = booking.passengerName.toLowerCase();
      const passengerPhone = booking.passengerPhone;
      const bookingIdLower = booking.id.toLowerCase();

      // Exact match for ticket ID (most specific)
      if (bookingIdLower === searchTerm) {
        return true;
      }

      // Exact match for phone number (no spaces or dashes)
      const normalizedSearchPhone = searchTerm.replace(/[\s-]/g, "");
      const normalizedBookingPhone = passengerPhone.replace(/[\s-]/g, "");
      if (normalizedBookingPhone === normalizedSearchPhone) {
        return true;
      }

      // For name search: exact full name match OR exact first/last name match
      const searchWords = searchTerm.split(/\s+/);
      const nameWords = passengerNameLower.split(/\s+/);

      // Exact full name match
      if (passengerNameLower === searchTerm) {
        return true;
      }

      // If searching with 2+ words, must match full name exactly
      if (searchWords.length >= 2) {
        return passengerNameLower === searchTerm;
      }

      // Single word search: must match at least one complete name part
      if (searchWords.length === 1) {
        return nameWords.some((word) => word === searchTerm);
      }

      return false;
    });

    return NextResponse.json({
      success: true,
      data: matchingBookings,
      count: matchingBookings.length,
    });
  } catch (error) {
    console.error("Error searching bookings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
