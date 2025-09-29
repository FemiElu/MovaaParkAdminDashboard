import { NextRequest, NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { driverId }: { driverId: string } = body;

    if (!tripId) {
      return NextResponse.json(
        { success: false, error: "Trip ID is required" },
        { status: 400 }
      );
    }

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: "driverId is required" },
        { status: 400 }
      );
    }

    const result = tripsStore.assignDriverWithConflictCheck(tripId, driverId);

    if (!result.success) {
      if (result.conflictTripId) {
        return NextResponse.json(
          {
            success: false,
            error: "DRIVER_CONFLICT",
            conflictType: "DRIVER_CONFLICT",
            conflictTripId: result.conflictTripId,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Driver assigned successfully",
    });
  } catch (error) {
    console.error("Error assigning driver:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
