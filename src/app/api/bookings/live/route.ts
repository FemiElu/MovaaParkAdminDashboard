import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { liveBookingsStore, bookingSimulator } from "@/lib/live-bookings";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parkId = searchParams.get("parkId") || session.user.parkId;
    const status = searchParams.get("status") || undefined;
    const date = searchParams.get("date") || undefined;
    const modifiedAfter = searchParams.get("modifiedAfter")
      ? parseInt(searchParams.get("modifiedAfter")!)
      : undefined;

    if (!parkId) {
      return NextResponse.json({ error: "Park ID required" }, { status: 400 });
    }

    // Verify user has access to this park
    if (session.user.role !== "SUPER_ADMIN" && session.user.parkId !== parkId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get filtered bookings
    const bookings = liveBookingsStore.getBookings({
      parkId,
      status,
      date,
      modifiedAfter,
    });

    // Get summary stats
    const stats = liveBookingsStore.getStats(parkId);

    // Get last modified timestamp for smart polling
    const lastModified = liveBookingsStore.getLastModified();

    return NextResponse.json({
      success: true,
      data: {
        bookings,
        stats,
        lastModified,
        total: bookings.length,
      },
    });
  } catch (error) {
    console.error("Error fetching live bookings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, parkId, destination, status } = body;

    // Verify user has access to this park
    if (session.user.role !== "SUPER_ADMIN" && session.user.parkId !== parkId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (action === "simulate") {
      // Manual booking simulation for testing
      const booking = bookingSimulator.generateTestBooking(
        parkId || session.user.parkId!,
        destination || "Ibadan",
        status || "RESERVED"
      );

      return NextResponse.json({
        success: true,
        data: booking,
        message: "Test booking simulated successfully",
      });
    }

    if (action === "start_simulation") {
      bookingSimulator.start();
      return NextResponse.json({
        success: true,
        message: "Auto-simulation started",
      });
    }

    if (action === "stop_simulation") {
      bookingSimulator.stop();
      return NextResponse.json({
        success: true,
        message: "Auto-simulation stopped",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing booking action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



