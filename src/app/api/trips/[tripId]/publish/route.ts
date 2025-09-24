import { NextRequest, NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;

    if (!tripId) {
      return NextResponse.json(
        { success: false, error: "Trip ID is required" },
        { status: 400 }
      );
    }

    const result = tripsStore.publishTrip(tripId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Trip published successfully",
    });
  } catch (error) {
    console.error("Error publishing trip:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
