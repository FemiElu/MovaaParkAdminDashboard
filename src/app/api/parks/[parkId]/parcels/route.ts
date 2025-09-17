import { NextRequest, NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ parkId: string }> }
) {
  try {
    const { parkId } = await context.params;
    const { searchParams } = new URL(req.url);
    const _date = searchParams.get("date");

    // Mock: return all unassigned parcels (no park/date tracking in seed)
    const parcels = tripsStore.getParcels();
    return NextResponse.json({ success: true, data: parcels });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
