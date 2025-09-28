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

    // Search bookings by query
    const searchTerm = query.toLowerCase();
    const matchingBookings = allBookings.filter((booking) => {
      return (
        booking.id.toLowerCase().includes(searchTerm) ||
        booking.passengerName.toLowerCase().includes(searchTerm) ||
        booking.passengerPhone.includes(searchTerm) ||
        booking.nokName.toLowerCase().includes(searchTerm) ||
        booking.nokPhone.includes(searchTerm)
      );
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
