import { NextRequest, NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ parkId: string }> }
) {
  try {
    const { parkId } = await context.params;
    const drivers = tripsStore.getDrivers(parkId);
    return NextResponse.json({ success: true, data: drivers });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
