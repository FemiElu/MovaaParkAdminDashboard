import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { routesApiService } from "@/lib/routes-api-service";
import {
  backendRouteToFrontend,
  frontendRouteToBackend,
} from "@/lib/route-converters";

const routeSchema = z.object({
  destination: z.string().min(1),
  destinationPark: z.string().trim().optional(),
  isActive: z.boolean(),
  parkId: z.string().optional(),
  from_state: z.string().optional(),
});

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

    const { searchParams } = new URL(request.url);
    const parkId = searchParams.get("parkId") || "default-park";

    // Fetch routes from backend API with token
    const response = await routesApiService.getAllRoutes(token);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to fetch routes" },
        { status: 500 }
      );
    }

    // Convert backend routes to frontend format
    const frontendRoutes = (response.data || []).map((route) =>
      backendRouteToFrontend(route, parkId)
    );

    return NextResponse.json({ success: true, data: frontendRoutes });
  } catch (error) {
    console.error("Error fetching routes:", error);
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
    const validation = routeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    const parkId = data.parkId || "default-park";

    // Convert frontend data to backend format
    const backendData = frontendRouteToBackend({
      destination: data.destination,
      destinationPark: data.destinationPark,
      from_state: data.from_state,
    });

    // Create route via backend API with token
    const response = await routesApiService.createRoute(backendData, token);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to create route" },
        { status: 500 }
      );
    }

    // Convert backend response to frontend format
    const frontendRoute = backendRouteToFrontend(response.data!, parkId);

    return NextResponse.json(
      { success: true, data: frontendRoute },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
