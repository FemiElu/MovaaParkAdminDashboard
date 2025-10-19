import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { tripApiService } from "@/lib/trip-api-service";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Forward the request to the backend API
    const response = await tripApiService.getAllTrips();

    if (response.success) {
      return NextResponse.json(response);
    } else {
      return NextResponse.json(
        { error: "Failed to fetch trips" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Error fetching trips:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    // Forward the request to the backend API
    const response = await tripApiService.createTrip(body);

    if (response.success) {
      return NextResponse.json(response, { status: 201 });
    } else {
      return NextResponse.json(
        { error: response.error || "Failed to create trip" },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Error creating trip:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
