import { NextRequest, NextResponse } from "next/server";
import { driverApiService } from "@/lib/driver-api-service";

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Forward the request to the backend API with token
    const response = await driverApiService.getAllDrivers(token);

    if (response.success) {
      return NextResponse.json(response);
    } else {
      return NextResponse.json(
        { error: response.error || "Failed to fetch drivers" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Error fetching drivers:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Forward the request to the backend API with token
    const response = await driverApiService.onboardDriver(body, token);

    if (response.success) {
      return NextResponse.json(response, { status: 201 });
    } else {
      return NextResponse.json(
        { error: response.error || "Failed to onboard driver" },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Error onboarding driver:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
