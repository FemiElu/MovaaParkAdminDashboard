import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { routeApiService } from "@/lib/route-api-service";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Forward the request to the backend API
    const response = await routeApiService.getAllRoutes();

    if (response.success) {
      return NextResponse.json(response);
    } else {
      return NextResponse.json(
        { error: "Failed to fetch routes" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Error fetching routes:", err);
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
    const response = await routeApiService.createRoute(body);

    if (response.success) {
      return NextResponse.json(response, { status: 201 });
    } else {
      return NextResponse.json(
        { error: response.error || "Failed to create route" },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Error creating route:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
