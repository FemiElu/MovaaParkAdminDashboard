import { NextRequest, NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await context.params;
    const body = await req.json();
    const { driverId } = body as { driverId?: string };
    if (!driverId) {
      return NextResponse.json(
        { error: "driverId is required" },
        { status: 400 }
      );
    }

    const result = tripsStore.assignDriver(tripId, driverId);
    if (!result.success) {
      return NextResponse.json(
        { error: "DRIVER_CONFLICT", conflictTripId: result.conflictTripId },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
