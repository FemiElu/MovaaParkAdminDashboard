import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { listRoutes, createRoute } from "@/lib/routes-store";

const routeSchema = z.object({
  destination: z.string().min(1),
  destinationPark: z.string().trim().optional(),
  isActive: z.boolean(),
  parkId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parkId = searchParams.get("parkId") || session.user.parkId;

    if (!parkId) {
      return NextResponse.json({ error: "Park ID required" }, { status: 400 });
    }

    // Verify user has access to this park
    if (session.user.role !== "SUPER_ADMIN" && session.user.parkId !== parkId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Return in-memory data for the specific park
    const routes = listRoutes(parkId) || [];
    return NextResponse.json({ success: true, data: routes });
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
    const session = await getServerSession(authOptions);
    if (!session) {
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
    const parkId = data.parkId || session.user.parkId;

    if (!parkId) {
      return NextResponse.json({ error: "Park ID required" }, { status: 400 });
    }

    // Verify user has access to this park
    if (session.user.role !== "SUPER_ADMIN" && session.user.parkId !== parkId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if route already exists for this park
    const existingRoutes = listRoutes(parkId) || [];
    const existingRoute = existingRoutes.find((r) => {
      const sameCity = r.destination === data.destination;
      const sameDestPark = (r as any).destinationPark || undefined;
      const requestedDestPark = data.destinationPark || undefined;
      return sameCity && sameDestPark === requestedDestPark;
    });

    if (existingRoute) {
      return NextResponse.json(
        {
          error: "Route to this destination already exists",
        },
        { status: 409 }
      );
    }

    // Create new route in in-memory data
    const newRoute = createRoute({ ...data, parkId });
    return NextResponse.json(
      { success: true, data: newRoute },
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
