import { NextRequest, NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";
import { TripFormData } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;

    if (!tripId) {
      return NextResponse.json(
        { success: false, error: "Trip ID is required" },
        { status: 400 }
      );
    }

    const trip = tripsStore.getTrip(tripId);

    if (!trip) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: trip,
    });
  } catch (error) {
    console.error("Error fetching trip:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    const body = await request.json();
    const {
      applyTo = "occurrence",
      ...updates
    }: {
      applyTo?: "occurrence" | "future" | "series";
    } & Partial<TripFormData> = body;

    if (!tripId) {
      return NextResponse.json(
        { success: false, error: "Trip ID is required" },
        { status: 400 }
      );
    }

    // Validate date if being updated
    if (updates.date) {
      const selectedDate = new Date(updates.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        return NextResponse.json(
          { success: false, error: "Date cannot be in the past" },
          { status: 400 }
        );
      }
    }

    // Validate seat count if being updated
    if (updates.seatCount !== undefined && updates.seatCount <= 0) {
      return NextResponse.json(
        { success: false, error: "Seat count must be greater than 0" },
        { status: 400 }
      );
    }

    // Validate price if being updated
    if (updates.price !== undefined && updates.price <= 0) {
      return NextResponse.json(
        { success: false, error: "Price must be greater than 0" },
        { status: 400 }
      );
    }

    const result = tripsStore.updateTrip(tripId, updates, applyTo);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Trip updated successfully",
    });
  } catch (error) {
    console.error("Error updating trip:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;

    if (!tripId) {
      return NextResponse.json(
        { success: false, error: "Trip ID is required" },
        { status: 400 }
      );
    }

    const trip = tripsStore.getTrip(tripId);
    if (!trip) {
      return NextResponse.json(
        { success: false, error: "Trip not found" },
        { status: 404 }
      );
    }

    // Check if trip can be deleted (only draft trips can be deleted)
    if (trip.status !== "draft") {
      return NextResponse.json(
        { success: false, error: "Only draft trips can be deleted" },
        { status: 400 }
      );
    }

    // Check if trip has confirmed bookings
    if (trip.confirmedBookingsCount > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete trip with confirmed bookings" },
        { status: 400 }
      );
    }

    // Remove trip from store
    const tripIndex = tripsStore["trips"].findIndex(
      (t: any) => t.id === tripId
    );
    if (tripIndex > -1) {
      tripsStore["trips"].splice(tripIndex, 1);
      tripsStore["persistToGlobal"]();
    }

    return NextResponse.json({
      success: true,
      message: "Trip deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting trip:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
