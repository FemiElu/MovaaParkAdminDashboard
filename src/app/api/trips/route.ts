import { NextRequest, NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parkId = searchParams.get("parkId");
    const date = searchParams.get("date");

    const trips = tripsStore.getTrips(parkId || undefined, date || undefined);

    return NextResponse.json({ success: true, data: trips });
  } catch (error) {
    console.error("Error fetching trips:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parkId, routeId, date, unitTime, seatCount, maxParcelsPerVehicle } =
      body;

    // Basic validation
    if (
      !parkId ||
      !routeId ||
      !date ||
      !unitTime ||
      !seatCount ||
      !maxParcelsPerVehicle
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get vehicles for the park
    const vehicles = tripsStore.getVehicles(parkId);
    if (vehicles.length === 0) {
      return NextResponse.json(
        { error: "No vehicles found for this park" },
        { status: 400 }
      );
    }

    // Use the first available vehicle
    const vehicle = vehicles[0];

    const trip = {
      id: `trip_${date}_${routeId}`,
      parkId,
      routeId,
      date,
      unitTime,
      vehicleId: vehicle.id,
      seatCount: Math.min(seatCount, vehicle.seatCount), // Enforce seat count limit
      confirmedBookingsCount: 0,
      maxParcelsPerVehicle: Math.min(
        maxParcelsPerVehicle,
        vehicle.maxParcelsPerVehicle
      ),
      status: "scheduled" as const,
      payoutStatus: "NotScheduled" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // For now, we'll just return the trip structure
    // In a real implementation, we'd add it to the store
    return NextResponse.json({ success: true, data: trip });
  } catch (error) {
    console.error("Error creating trip:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
