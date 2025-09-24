import { NextRequest, NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";
import { TripFormData } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parkId = searchParams.get("parkId");
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    if (!parkId) {
      return NextResponse.json(
        { success: false, error: "Park ID is required" },
        { status: 400 }
      );
    }

    let trips = tripsStore.getTrips(parkId, date || undefined);

    // Filter by status if provided
    if (status) {
      trips = trips.filter((trip) => trip.status === status);
    }

    return NextResponse.json({
      success: true,
      data: trips,
    });
  } catch (error) {
    console.error("Error fetching trips:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parkId, ...tripData }: { parkId: string } & TripFormData = body;

    if (!parkId) {
      return NextResponse.json(
        { success: false, error: "Park ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = [
      "routeId",
      "date",
      "unitTime",
      "vehicleId",
      "seatCount",
      "price",
    ];
    for (const field of requiredFields) {
      if (!tripData[field as keyof TripFormData]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate date is not in the past
    const selectedDate = new Date(tripData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return NextResponse.json(
        { success: false, error: "Date cannot be in the past" },
        { status: 400 }
      );
    }

    // Validate seat count
    if (tripData.seatCount <= 0) {
      return NextResponse.json(
        { success: false, error: "Seat count must be greater than 0" },
        { status: 400 }
      );
    }

    // Validate price
    if (tripData.price <= 0) {
      return NextResponse.json(
        { success: false, error: "Price must be greater than 0" },
        { status: 400 }
      );
    }

    const result = tripsStore.createTrip(tripData, parkId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        trips: result.trips,
      },
      message:
        result.trips?.length === 1
          ? "Trip created successfully"
          : `${result.trips?.length} recurring trips created successfully`,
    });
  } catch (error) {
    console.error("Error creating trip:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
