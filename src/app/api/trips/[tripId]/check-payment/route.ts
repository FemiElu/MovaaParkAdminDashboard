import { NextRequest, NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { bookingId }: { bookingId: string } = body;

    if (!tripId) {
      return NextResponse.json(
        { success: false, error: "Trip ID is required" },
        { status: 400 }
      );
    }

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Simulate Paystack webhook confirmation
    const result = tripsStore.confirmBookingPayment(bookingId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment confirmed successfully",
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
