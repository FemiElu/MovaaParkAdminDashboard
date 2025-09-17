import { NextRequest, NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await context.params;
    const body = await req.json();
    const { bookingId } = body as { bookingId?: string };
    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      );
    }
    const result = tripsStore.checkInBooking(tripId, bookingId);
    if (!result.success) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
