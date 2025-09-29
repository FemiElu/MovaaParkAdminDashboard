import { NextRequest, NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tripId,
      passengerName,
      passengerPhone,
      nokName,
      nokPhone,
      nokAddress,
      amount,
    } = body;

    // Validate required fields
    const requiredFields = [
      "tripId",
      "passengerName",
      "passengerPhone",
      "nokName",
      "nokPhone",
      "nokAddress",
      "amount",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    const result = tripsStore.createBookingWithHold(tripId, {
      passengerName,
      passengerPhone,
      nokName,
      nokPhone,
      nokAddress,
      amountPaid: amount,
      paymentStatus: "pending",
      bookingStatus: "pending",
    });

    if (!result.success) {
      if (result.conflictType === "SLOT_TAKEN") {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            conflictType: "SLOT_TAKEN",
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
      data: {
        booking: result.booking,
        holdToken: result.holdToken,
      },
      message: "Booking created with 5-minute hold",
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
