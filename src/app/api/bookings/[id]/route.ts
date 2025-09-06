import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { liveBookingsStore } from "@/lib/live-bookings";
import { z } from "zod";

type BookingStatus =
  | "RESERVED"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED"
  | "COMPLETED";

const patchSchema = z
  .object({
    status: z
      .enum(["RESERVED", "CONFIRMED", "EXPIRED", "CANCELLED", "COMPLETED"])
      .optional(),
  })
  .passthrough();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const booking = liveBookingsStore.getBooking(id);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify user has access to this park
    if (
      session.user.role !== "SUPER_ADMIN" &&
      session.user.parkId !== booking.parkId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const { status, ...additionalData } = parsed.data as {
      status?: BookingStatus;
    } & Record<string, unknown>;

    const booking = liveBookingsStore.getBooking(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify user has access to this park
    if (
      session.user.role !== "SUPER_ADMIN" &&
      session.user.parkId !== booking.parkId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate status transitions
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      RESERVED: ["CONFIRMED", "CANCELLED", "EXPIRED"],
      CONFIRMED: ["CANCELLED", "COMPLETED"],
      EXPIRED: [],
      CANCELLED: [],
      COMPLETED: [],
    };

    if (
      status &&
      !validTransitions[booking.status as BookingStatus].includes(status)
    ) {
      return NextResponse.json(
        {
          error: `Cannot change status from ${booking.status} to ${status}`,
        },
        { status: 400 }
      );
    }

    // Update booking
    const updatedBooking = liveBookingsStore.updateBookingStatus(
      id,
      status || booking.status,
      additionalData
    );

    if (!updatedBooking) {
      return NextResponse.json(
        { error: "Failed to update booking" },
        { status: 500 }
      );
    }

    // Log admin action
    console.log(
      `🔧 Admin ${session.user.email} updated booking ${id}: ${booking.status} → ${status}`
    );

    return NextResponse.json({
      success: true,
      data: updatedBooking,
      message: "Booking updated successfully",
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
