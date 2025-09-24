import { NextRequest, NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ parkId: string }> }
) {
  try {
    await context.params; // parkId not used in current implementation
    const { searchParams } = new URL(req.url);
    searchParams.get("date"); // date not used in current implementation

    // Mock: return all unassigned parcels (no park/date tracking in seed)
    const parcels = tripsStore.getParcels();
    return NextResponse.json({ success: true, data: parcels });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
