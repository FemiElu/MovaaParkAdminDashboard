import { NextRequest, NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ parkId: string }> }
) {
  try {
    const { parkId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!parkId) {
      return NextResponse.json(
        { success: false, error: "Park ID is required" },
        { status: 400 }
      );
    }

    // Get trips with park metadata for public API
    // Only return published/live trips for public consumption
    const trips = tripsStore.getTripsWithParkMetadata(
      parkId,
      date || undefined
    );
    const publicTrips = trips.filter(
      (trip) => trip.status === "published" || trip.status === "live"
    );

    // Check if driver details should be visible (5 hours before departure)
    const now = new Date();
    const tripsWithDriverVisibility = publicTrips.map((trip) => {
      const tripDateTime = new Date(`${trip.date}T${trip.unitTime}`);
      const fiveHoursBefore = new Date(
        tripDateTime.getTime() - 5 * 60 * 60 * 1000
      );

      const shouldShowDriverDetails = now >= fiveHoursBefore;

      return {
        ...trip,
        driverPhone: shouldShowDriverDetails ? trip.driverPhone : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      data: tripsWithDriverVisibility,
    });
  } catch (error) {
    console.error("Error fetching public trips:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
