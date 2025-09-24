import { NextRequest, NextResponse } from "next/server";
import { tripsStore } from "@/lib/trips-store";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await context.params;
    const body = await req.json();
    const { parcelIds, override } = body as {
      parcelIds?: string[];
      override?: boolean;
    };

    if (!Array.isArray(parcelIds) || parcelIds.length === 0) {
      return NextResponse.json(
        { error: "parcelIds is required" },
        { status: 400 }
      );
    }

    const result = tripsStore.assignParcels(tripId, parcelIds, !!override);
    if (!result.success) {
      return NextResponse.json(
        { error: "PARCEL_CAPACITY_EXCEEDED", reason: result.reason },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
