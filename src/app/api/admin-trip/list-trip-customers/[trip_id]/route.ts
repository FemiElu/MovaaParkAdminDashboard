import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { tripApiService } from "@/lib/trip-api-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trip_id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;

    // Forward the request to the backend API
    const response = await tripApiService.getTripCustomers(
      resolvedParams.trip_id
    );

    if (response.success) {
      return NextResponse.json(response);
    } else {
      return NextResponse.json(
        { error: response.error || "Failed to fetch trip customers" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Error fetching trip customers:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

