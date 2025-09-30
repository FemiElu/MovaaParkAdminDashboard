import { NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";

export async function POST() {
  try {
    // Reset the store to regenerate bookings with checkedIn: false
    tripsStore.resetStore();

    return NextResponse.json({
      success: true,
      message:
        "Store reset successfully. All bookings now have checkedIn: false.",
    });
  } catch (error) {
    console.error("Error resetting store:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset store" },
      { status: 500 }
    );
  }
}


